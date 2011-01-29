package com.kalicinscy.smsgate.server;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.LinkedHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.repackaged.org.json.JSONException;
import com.google.appengine.repackaged.org.json.JSONObject;
import com.kalicinscy.smsgate.server.ConfigHelper;
import com.kalicinscy.smsgate.server.HistoryHelper;



public class SendServlet extends HttpServlet {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 2031987905959448587L;
	
	private static final Logger LOG = Logger.getLogger(SendServlet.class.getName());
	
	
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
		
		UserPreferences up = null;
		try{
			up = ConfigHelper.getUserPreferences( gateType );
		} catch( NotLoggedInException e ){
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp, e);
			return;
		} catch( UserPreferencesException e ){
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_PREFERENCES_MISSING, resp, e);
			return;
		}
		
		String login = up.getGateLogin();
		String password = up.getGatePassword();
		String body = req.getParameter("body");
		String recipient = req.getParameter("recipient");
		String saveToHistory = req.getParameter( "history" );
		String gateInnerType = req.getParameter( "gateType" );
		
		String return_host = "http%3A%2F%2F";
		return_host += req.getServerName();
		return_host += "%2Fera_PL%2Fhandler";
		
		String encodedBody = URLEncoder.encode( body , "UTF-8");
		String pathUrl = (gateInnerType != null && gateInnerType.equals( "sponsored" )) ? "sponsored" : "omnix"; //default omnix
		String sendUrl = "http://www.era.pl/msg/api/do/tinker/%s?" +"message=%s&number=%s&password=%s&login=%s&failure=%s&success=%s&mms=false";
		String formattedUrl = String.format(sendUrl, pathUrl, encodedBody, recipient, password, login, return_host, return_host);
		
//		serverResponse = "{\"cost\":\"18\",\"tokens_left\":\"1000\",\"error\":\"0\",\"counter\":\"1\"}";
        
        JSONObject srvObj = this.getGateResponse(formattedUrl);
        
        int statusCode = 0;
        try {
			statusCode = srvObj.getInt("error");
		} catch (JSONException e2) {}
        
		if( srvObj == null ){
			ConfigHelper.writeStatusJSON(Status.ERROR_EXT_SERVER_RESPONSE, resp);
			return;
		} else if( statusCode != 0 ){
			resp.setContentType("application/json");
			resp.setStatus(200);
			srvObj.remove( "error" );
			try {
				srvObj.put( "gateError" , statusCode);
				srvObj.put("debug",encodedBody);
			} catch (JSONException e) {}
			resp.getWriter().println(srvObj.toString());
			return;
		}
		
		if( saveToHistory != null && saveToHistory.toLowerCase().equals("true") ){
			
			String browserID = req.getParameter( "bid" );
			
			int cost = 0;
			
			try {
				cost = srvObj.getInt( "cost" );
			} catch (JSONException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			
			String hash = HistoryHelper.insertHistory(body, cost, gateType, recipient, login, browserID); 
			if( hash == null ){
				//@TODO
				//error, not saved
			} else {
				try {
					srvObj.put("hash", hash);
				} catch (JSONException e) {
					
				}
			}
		}
		
		resp.setContentType("application/json");
		resp.setStatus(200);
		
		resp.getWriter().println(srvObj.toString());
	}
	
	@Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		
		//sprawdzenie stanu konta.
		
		
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
		
		UserPreferences up = null;
		try{
			up = ConfigHelper.getUserPreferences( gateType );
		} catch( NotLoggedInException e ){
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_NOT_LOGGED_IN, resp, e);
			return;
		} catch( UserPreferencesException e ){
			ConfigHelper.writeStatusJSON(Status.ERROR_USER_PREFERENCES_MISSING, resp, e);
			return;
		}
		
		String login = up.getGateLogin();
		String password = up.getGatePassword();
		
		String gateInnerType = req.getParameter( "gateType" );
		
		String return_host = "http%3A%2F%2F";
		return_host += req.getServerName();
		return_host += "%2Fera_PL%2Fhandler";
		
//		String sendUrl = "http://www.era.pl/msg/api/do/tinker/omnix?" +
//			"message=n&number=XXX&password=%s&login=%s&failure=%s&success=%s&mms=false";
//		String formattedUrl = String.format(sendUrl, password, login, return_host, return_host);
		
		String pathUrl = (gateInnerType != null && gateInnerType.equals( "sponsored" )) ? "sponsored" : "omnix"; //default omnix
		String sendUrl = "http://www.era.pl/msg/api/do/tinker/%s?message=n&number=XXX&password=%s&login=%s&failure=%s&success=%s&mms=false";
		String formattedUrl = String.format(sendUrl, pathUrl, password, login, return_host, return_host);
		
		JSONObject srvObj = this.getGateResponse(formattedUrl);
		if( srvObj == null ){
			ConfigHelper.writeStatusJSON(Status.ERROR_EXT_SERVER_RESPONSE, resp);
			return;
		}
		resp.setContentType("application/json");
		resp.setStatus(200);
		resp.getWriter().println(srvObj.toString());
	}
	
	
	private JSONObject getGateResponse(String formattedUrl){
		JSONObject srvObj = null;
		try {
			URL send = new URL(formattedUrl);
			URLConnection srv = send.openConnection();
			HttpURLConnection httpConn = (HttpURLConnection)srv;
			httpConn.setInstanceFollowRedirects(false);
			srv.connect();
			
			//http://jarrod.local.com/era_PL/handler?X-ERA-cost=0&X-ERA-tokens=1444&X-ERA-error=5
			String redirect = srv.getHeaderField("location");
			if(redirect == null){
				redirect = httpConn.getHeaderField("location");
			}
	        if (redirect != null){
	        	srvObj = this.parseRedirectParams(redirect);
	        } else {
	        	LOG.log( Level.WARNING,  "Redirect header is null for url: "+formattedUrl);
	        }

		} catch (MalformedURLException me) {
	        //System.out.println("MalformedURLException: " + me);
			LOG.log( Level.WARNING,  "MalformedURLException: "+ me.getMessage());
	    } catch (IOException ioe) {
	        //System.out.println("IOException: " + ioe);
	    	LOG.log( Level.WARNING,  "IOException: "+ ioe.getMessage());
	    }
	    return srvObj;
	}
	
	
	private JSONObject parseRedirectParams(String url){
		int ch = url.indexOf( "?" );
		if( ch != -1){
			url = url.substring( ch+1 );
		}
		
		String[] paramsPairs = url.split("&");
		int paramcCount = paramsPairs.length;
		LinkedHashMap<String, String> lhm = new LinkedHashMap<String, String>();
		for( int i=0; i<paramcCount;i++ ){
			String[] _tmp = paramsPairs[i].split("=");
			if( _tmp.length == 2 && _tmp[0].length() != 0 && _tmp[1].length() != 0 ){
				lhm.put(_tmp[0], _tmp[1]);
			}
		}
		JSONObject resp_obj = new JSONObject();
		String[] possibleValues = {"X-ERA-error","X-ERA-counter","X-ERA-tokens","X-ERA-cost"};
		String[] mappedParams = {"error","counter","tokens_left","cost"};
		
		for( int i=0; i< possibleValues.length; i++ ){
			if( lhm.containsKey( possibleValues[i] ) ){
				try {
					resp_obj.put( mappedParams[i], lhm.get( possibleValues[i] ));
				} catch (JSONException e) {}
			}
		}
		if( resp_obj.length() == 0){
			LOG.log( Level.WARNING,  "srv redirect params:  "+url);
		}
		return resp_obj;
	}
	
}
