package com.kalicinscy.smsgate.server;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.ListIterator;
import java.util.logging.Logger;

import javax.jdo.PersistenceManagerFactory;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PhoneNumber;
import com.google.appengine.api.datastore.QueryResultList;
import com.google.appengine.api.users.User;
import com.google.appengine.repackaged.org.json.JSONArray;
import com.google.appengine.repackaged.org.json.JSONException;
import com.google.appengine.repackaged.org.json.JSONObject;
import com.kalicinscy.smsgate.server.ConfigHelper;

public class HistoryServlet extends HttpServlet {
	
	private static final Logger LOG = Logger.getLogger(HistoryServlet.class.getName());
	/**
	 * 
	 */
	private static final long serialVersionUID = -6845526474231431604L;
	
	@Override
	protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		resp.setContentType("application/json");
		resp.setCharacterEncoding("UTF-8");
		resp.setStatus(200);
//		System.out.println("HIT");
		String[] hash = req.getParameterValues( "h[]" );
		if( hash == null || hash.length == 0 ){
			ConfigHelper.writeStatusJSON(Status.OK, resp);
        	return;
		}
		
		User u = null;
		try {
			u = ConfigHelper.getAppUser();
		} catch (IOException e1) {}
		
		if( u == null ){
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp);
			return;
		}
		PersistenceManagerFactory mpf = PMF.get();
		
		UserHistory.removeHistory(mpf.getPersistenceManager(),hash,u);
		
		ConfigHelper.writeStatusJSON(Status.OK, resp);
	}
	
	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		String[] hash = req.getParameterValues( "h[]" );
		
		if( hash == null || hash.length == 0 ){
			ConfigHelper.writeStatusJSON(Status.OK, resp);
        	return;
		}
		
        User u = null;
		try {
			u = ConfigHelper.getAppUser();
		} catch (IOException e1) {}
		
		if( u == null ){
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp);
			return;
		}
		
		JSONArray responseJSON = new JSONArray();
		
		int max = hash.length;
		for( int i = 0; i < max; i++ ){
			List<Entity> el = UserHistory.getHistoryByHash(hash[i],u);
			
			if( el.size() != 1 ){
				continue;
			}
			
			Entity e = el.get(0);
			JSONObject eo = new JSONObject();
			
			try {
				eo.put("cost", e.getProperty("cost"));
				eo.put("body", e.getProperty("body"));
				String num = ((PhoneNumber) e.getProperty("recipient")).getNumber();
				eo.put("recipient", num);
	        	long time = ((Date) e.getProperty("sentTimestamp") ).getTime();
	        	eo.put("time", time);
	    		String hashStr = (String) e.getProperty("hash");
	    		eo.put("hash", hashStr);
	    		//String sender = ((PhoneNumber) e.getProperty("sender")).getNumber();
	    		//eo.put("sender", sender);
	    		responseJSON.put( eo );
			} catch (JSONException e1) {}
		}
		
		resp.setContentType("application/json");
		resp.setCharacterEncoding("UTF-8");
		resp.getWriter().println( responseJSON.toString() );
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
        
        User u = null;
		try {
			u = ConfigHelper.getAppUser();
		} catch (IOException e1) {}
		
		if( u == null ){
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp);
			return;
		}
    	
		String webCursor = null;
		if( req.getParameter( "c" ) != null ){
			webCursor = req.getParameter( "c" ); 
		}
		
    	QueryResultList<Entity> history = null;
        if( req.getParameter("t") != null ){
        	long updateTime = Long.parseLong( req.getParameter("t") );
        	history = UserHistory.getUserHistory(webCursor, u, updateTime, gateType);
        } else {
        	history = UserHistory.getUserHistory(webCursor, u, gateType);
        }
        if( history == null || history.size() == 0 ){
        	ConfigHelper.writeStatusJSON(Status.OK, resp);
        	return;
        }
        
        String cursor = history.getCursor().toWebSafeString();
        
        JSONObject responseJson = new JSONObject();
        
        JSONArray historyArray = new JSONArray();
        ListIterator<Entity> it = history.listIterator();
        while( it.hasNext() ){
        	Entity e = it.next();
    		String hash = (String) e.getProperty("hash");
    		if( hash != null && !hash.equals( "" ) ){
	        	historyArray.put( hash );
    		}
        }
        try {
        	responseJson.put( "data" , historyArray);
        	responseJson.put( "cursor" , cursor);
		} catch (JSONException e) {}

        resp.setContentType("application/json");
		resp.getWriter().println( responseJson.toString() );
	}
}
