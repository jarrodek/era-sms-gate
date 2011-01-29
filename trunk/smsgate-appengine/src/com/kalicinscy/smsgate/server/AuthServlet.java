/**
 * 
 */
package com.kalicinscy.smsgate.server;

import java.io.IOException;
import java.net.URLEncoder;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;



/**
 * Main implementation from com.google.android.chrometophone.server
 * @author jarrod
 *
 */
public class AuthServlet extends HttpServlet {

	/**
	 * Generated UID
	 */
	private static final long serialVersionUID = 1624738648855754062L;
	
	private static final Logger log =
        Logger.getLogger(SendServlet.class.getName());
	
	private static final String ERROR_STATUS = "ERROR";
	private static final String OK_STATUS = "OK";
	private static final String LOGIN_REQUIRED_STATUS = "LOGIN_REQUIRED";
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		resp.setContentType("text/html");
		
		if( req.getRequestURI().startsWith("/status") ){
			//it's just a check for user ststus
			UserService us = UserServiceFactory.getUserService();
			resp.setStatus(200);
			if( us.isUserLoggedIn() ){
				resp.getWriter().println(OK_STATUS + " " + us.getCurrentUser().getEmail() );
			} else {
				resp.getWriter().println(LOGIN_REQUIRED_STATUS);
			}
			return;
		}
		
		boolean signIn = req.getRequestURI().startsWith("/signin");
		// Get the extension return URL
        String extRet = req.getParameter("extret");
        if (extRet == null) {
            resp.setStatus(400);
            resp.getWriter().println(ERROR_STATUS + " (extret parameter missing)");
            return;
        }
        
        UserService userService = UserServiceFactory.getUserService();
        
        // If login/logout is complete, redirect to the extension page. Otherwise, send user to
        // login/logout, setting the continue page back to this servlet (since UserService does
        // not understand chrome-extension:// URLs)
        if (req.getParameter("completed") != null) {
        	// Server-side redirects don't work for chrome-extension:// URLs so we do a client-
            // side redirect instead
        	
        	//check if user click log in...
        	if( signIn && !userService.isUserLoggedIn() ){
        		
        		String followOnURL = req.getScheme() + "://" + req.getServerName() + "/index.html#loginInterupted";
        		resp.sendRedirect(followOnURL);
        		return;
        	}
        	
        	
        	// Sanitize the extRet URL for XSS protection
        	String regExChrome = "chrome-extension://[a-z]+" +
            	(signIn ? "/help\\.html(#signed_in)?" : "/signed_out\\.html");
        	if (extRet.matches(regExChrome)) {
                resp.getWriter().println("<meta http-equiv=\"refresh\" content=\"0;url=" + extRet + "\">");
            } else {
                resp.setStatus(400);
                resp.getWriter().println(ERROR_STATUS + " (invalid redirect)");
                log.warning("Invalid redirect " + extRet);
            }
        	
        } else {
        	String followOnURL = req.getRequestURI() + "?completed=true&extret=" +
    			URLEncoder.encode(extRet, "UTF-8");
        	resp.sendRedirect( signIn ? userService.createLoginURL(followOnURL) : userService.createLogoutURL(followOnURL) );
        }
		
	}
	
}
