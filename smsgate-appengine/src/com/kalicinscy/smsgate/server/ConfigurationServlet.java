package com.kalicinscy.smsgate.server;

import java.io.IOException;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.users.User;
import com.google.appengine.repackaged.org.json.JSONException;
import com.google.appengine.repackaged.org.json.JSONObject;
import com.kalicinscy.smsgate.server.ConfigHelper;

public class ConfigurationServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 6196251992132678949L;
	private static final Logger LOG = Logger.getLogger(ConfigurationServlet.class.getName());
	
	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		
		// Basic XSRF protection (TODO: remove X-Extension in a future release for consistency)
        if (req.getHeader("X-Same-Domain") == null) {
            resp.setStatus(400);
            resp.getWriter().println(Status.ERROR_GENERAL + " (Missing header)");
            LOG.warning("Missing header");
            return;
        }
        
        String gateType = req.getParameter("ver");
        if( gateType == null ){
        	resp.setStatus(400);
            resp.getWriter().println(Status.ERROR_GENERAL + " (Missing ver parameter)");
            LOG.warning("Missing version");
            return;
        }
        
        User u = ConfigHelper.getAppUser();
        if( u == null ){
        	resp.setStatus(200);
			resp.getWriter().println(Status.ERROR_USER_NOT_LOGGED_IN);
    		return;
        }
		
        
		JSONObject resp_obj = new JSONObject();
		UserPreferences up = null;
		try {
			up = ConfigHelper.getUserPreferences(gateType);
		} catch (NotLoggedInException e) {
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp, e);
			return;
		} catch (UserPreferencesException e) {
			up = new UserPreferences(u);
			String uid = u.getUserId();
			String keyValue = uid + "#" + gateType;
			up.setKey( KeyFactory.createKey( UserPreferences.class.getSimpleName() , keyValue  ) );
		}
		
		String password = req.getParameter("pwd");
		String login = req.getParameter("log");
		String synchGmail = req.getParameter("gmail");
		String historyEnabled = req.getParameter("hisory");
		String gateInnerType = req.getParameter("gateType");
		
		if( password != null ){
			up.setGatePassword( password );
		}
		if( login != null ){
			up.setGateLogin( login );
		}
		if( synchGmail != null ){
			up.setSynchGmail( (synchGmail.equals( "true" )) );
		}
		if( historyEnabled != null ){
			up.setDefaultHistory( (historyEnabled.equals( "true" )) );
		}
		if( gateInnerType != null ){
			up.setGateInnerType( gateInnerType );
		}
		PersistenceManager pm = ConfigHelper.getPersistenceManager();
		try {
            pm.makePersistent(up);
		}catch (Exception e){
			ConfigHelper.writeStatusJSON(Status.ERROR_SAVE_DATABASE, resp, e);
			return;
        } finally {
            pm.close();
        }
        try {
        	resp_obj.put("result", Status.OK);
		} catch (JSONException e1) {}
		resp.setContentType("application/json");
		resp.getWriter().println( resp_obj.toString() );
	}
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		
		String gateType = req.getParameter("ver");
        if( gateType == null ){
        	resp.setStatus(400);
            resp.getWriter().println(Status.ERROR_GENERAL + " (Missing ver parameter)");
            LOG.warning("Missing version");
            return;
        }
		
		JSONObject resp_obj = new JSONObject();
		UserPreferences up = null;
		try {
			up = ConfigHelper.getUserPreferences(gateType);
		} catch (NotLoggedInException e) {
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp, e);
			return;
		} catch (UserPreferencesException e) {
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_PREFERENCES_MISSING, resp, e);
			return;
		}
		
		boolean isConfigUpdateRequest = false;
		long extensionUpdateTime = 0;
		String payload = req.getParameter("payload");
		if( payload != null ){
			if( payload.equals("update") ){
				isConfigUpdateRequest = true;
				if( req.getParameter("t") != null ){
					extensionUpdateTime = Long.parseLong( req.getParameter("t") );
				}
			}
		}
		
		long sec = 0;
		if( up.getUpdateTimestamp() != null ){
			sec = up.getUpdateTimestamp().getTime();
		}
		
		if( isConfigUpdateRequest && extensionUpdateTime != 0 ){
			long difference = sec -  extensionUpdateTime;
			//aby konfiguracja tutaj była nowsza od tej w rozszerzeniu
			//to różnica czasów musi być większa od 0
			if( difference < 0 ){
				ConfigHelper.writeStatusJSON(Status.OK, resp); // nie ma nowszej konfiguracji
				return;
			}
		}
		
		try {
			resp_obj.put("login", up.getGateLogin());
			resp_obj.put("type", up.getGateType());
			resp_obj.put("historyEnabled", String.valueOf( up.isDefaultHistory() )  );
			resp_obj.put("synchGmail", String.valueOf( up.isSynchGmail() ) );
			resp_obj.put("updated", sec);
			resp_obj.put("gateInnerType", up.getGateInnerType() );
		} catch (JSONException e1) {}
		resp.setContentType("application/json");
		resp.getWriter().println( resp_obj.toString() );
	}
	
}
