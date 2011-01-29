package com.kalicinscy.smsgate.server;

import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ChannelServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = -7074903202504443133L;

	@Override
	public void doOptions(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {

		resp.addHeader("Access-Control-Allow-Origin", "*");
		// if( req.getHeader("Access-Control-Request-Method") != null )
		// resp.addHeader("Access-Control-Allow-Methods",
		// req.getHeader("Access-Control-Request-Method"));
		if (req.getHeader("Access-Control-Request-Headers") != null)
			resp.addHeader("Access-Control-Allow-Headers",
					req.getHeader("Access-Control-Request-Headers")
							+ ", X-Same-Domain");
		resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		// String orgin = req.getHeader("Origin");
		//
		// if( orgin != null ){
		// if( orgin.startsWith( "chrome-extension://" ) ){
		// resp.setHeader("Access-Control-Allow-Origin", "*");
		// resp.setHeader("Access-Control-Allow-Credentials", "true");
		// }
		// } else {
		// resp.setHeader("Access-Control-Allow-Origin", "*");
		// resp.setHeader("Access-Control-Allow-Credentials", "true");
		// }
		//
		 resp.setHeader("Allow", "GET, POST, OPTIONS");
		// resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
		// resp.setHeader("Access-Control-Allow-Headers",
		// "Content-Type, X-Same-Domain");//, Access-Control-Allow-Origin
		 resp.setHeader("Access-Control-Max-Age", "1728000");

		// System.out.println("========= REQ HEADERS ==========");
		// @SuppressWarnings("unchecked")
		// Enumeration<String> n = req.getHeaderNames();
		// while(n.hasMoreElements()){
		// String name = n.nextElement();
		// System.out.println("name: "+name+", value: "+req.getHeader( name ));
		// }

	}

	// @Override
	// public void doGet(HttpServletRequest req, HttpServletResponse resp)
	// throws IOException {
	// if (req.getHeader("X-Same-Domain") == null) {
	// resp.setStatus(400);
	// resp.getWriter().println(Status.ERROR_GENERAL +
	// " (Missing X-Same-Domain header)");
	// return;
	// }
	// String chromeRegistrationId = req.getParameter("chromeregid");
	// if (chromeRegistrationId == null ||
	// "".equals(chromeRegistrationId.trim())) {
	// resp.setStatus(400);
	// resp.getWriter().println(Status.ERROR_GENERAL +
	// "(Must specify devregid)");
	// return;
	// }
	//
	//
	// User u = null;
	// try {
	// u = ConfigHelper.getAppUser();
	// } catch (IOException e1) {}
	//
	// if( u == null ){
	// ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp);
	// return;
	// }
	// //String email = u.getEmail();
	// //System.out.println("chromeregID: "+chromeRegistrationId);
	// String channelId =
	// ChannelServiceFactory.getChannelService().createChannel(chromeRegistrationId);
	//
	//
	//
	// JSONObject responseJSON = new JSONObject();
	// try {
	// responseJSON.put( "id" , channelId);
	// } catch (JSONException e) {}
	//
	// //resp.setHeader("Access-Control-Allow-Origin", "*");
	// resp.setContentType("application/json");
	// resp.getWriter().println( responseJSON.toString() );
	// }

	// api calls from extension background workers
	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		String payload = req.getParameter("payload");
		if (payload == null || "".equals(payload.trim())) {
			resp.setStatus(400);
			resp.getWriter().println(
					Status.ERROR_GENERAL + "(Must specify devregid)");
			return;
		}
		
		
		
	}

}
