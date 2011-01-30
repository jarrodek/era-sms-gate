package com.kalicinscy.smsgate.server;

import java.io.IOException;
import java.util.LinkedHashMap;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.oauth.OAuthService;
import com.google.appengine.api.oauth.OAuthServiceFactory;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.repackaged.org.json.JSONException;
import com.google.appengine.repackaged.org.json.JSONObject;
import com.kalicinscy.smsgate.server.NotLoggedInException;
import com.kalicinscy.smsgate.server.Status;
import com.kalicinscy.smsgate.server.UserPreferences;
import com.kalicinscy.smsgate.server.UserPreferencesException;

public final class ConfigHelper {
	private ConfigHelper(){}
	
	public static User getAppUser() throws IOException {
        // Is it OAuth ?
        User user = null;
        OAuthService oauthService = OAuthServiceFactory.getOAuthService();
        try {
            user = oauthService.getCurrentUser();
            if (user != null) {
                return user;
            }
        } catch (Throwable t) {
            user = null;
        }
        UserService userService = UserServiceFactory.getUserService();
        user = userService.getCurrentUser();
        return user;
    }
	
	public static UserPreferences getUserPreferences(final String gateType) throws NotLoggedInException, UserPreferencesException{
		User u = null;
		try {
			u = ConfigHelper.getAppUser();
		} catch (IOException e1) {}
		
		if( u == null ){
			throw new NotLoggedInException( );
		}
		
    	PersistenceManager pm = ConfigHelper.getPersistenceManager();
    	UserPreferences userdata = UserPreferences.getUserGate(pm, u, gateType);
//    	System.out.println(u.getEmail() );
//    	if( userdata != null ){
//    		System.out.println(userdata.getGateLogin());
//    	}
    	if( userdata == null || userdata.getGateLogin() == null || userdata.getGateLogin().equals("") ){
    		throw new UserPreferencesException("Empty data");
    	}
    	pm.close();
    	return userdata;
	}
	
	public static PersistenceManager getPersistenceManager() {
		return PMF.get().getPersistenceManager();
	}
	/**
	 * Write error message in JSNO to request response buffer.
	 * 
	 * @param status
	 * @param resp
	 */
	public static void writeStatusJSON(Status status, HttpServletResponse resp){
		resp.setContentType("application/json");
		JSONObject resp_obj = new JSONObject();
		LinkedHashMap<String, Object> lhm = new LinkedHashMap<String, Object>();
		try {
			lhm.put("code", status.getCode());
			lhm.put("message", status.getMessage());
			resp_obj.put("error", lhm);
		} catch (JSONException e1) {}
		try {
			resp.getWriter().println( resp_obj.toString() );
		} catch (IOException e) {}
	}
	/**
	 * Write error message in JSNO to request response buffer.
	 * @param status
	 * @param resp
	 * @param e
	 */
	public static void writeStatusJSON(Status status, HttpServletResponse resp, Exception e){
		resp.setContentType("application/json");
		JSONObject resp_obj = new JSONObject();
		LinkedHashMap<String, Object> lhm = new LinkedHashMap<String, Object>();
		try {
			lhm.put("code", status.getCode());
			lhm.put("message", status.getMessage());
			lhm.put("evmessage",  e.getMessage() );
			resp_obj.put("error", lhm);
		} catch (JSONException e1) {}
		try {
			resp.getWriter().println( resp_obj.toString() );
		} catch (IOException e2) {}
	}
}
