package com.kalicinscy.smsgate.server;

import java.io.IOException;
import java.util.Enumeration;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.repackaged.org.json.JSONException;
import com.google.appengine.repackaged.org.json.JSONObject;

public class EraPlResponseServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 6320825382581345591L;
	
	@Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		//System.out.println(" =========== EraPlResponseServlet =================");
		resp.setContentType("text/html");
		JSONObject resp_obj = new JSONObject();
		
		@SuppressWarnings("unchecked")
		Enumeration<String> e = req.getParameterNames();
		while (e.hasMoreElements()) {
			String name = (String)e.nextElement();
			String value = req.getParameter( name );
			try {
				
	        	resp_obj.put( preplaceEraParams( name ), value);
			} catch (JSONException e1) {}
			//System.out.println(name + " = " + value);
		}
		resp.getWriter().println( resp_obj.toString() );
		//System.out.println(" =========== EraPlResponseServlet END =================");
	}
	
	private String preplaceEraParams(String param){
		if( param.equals("X-ERA-tokens") ){
			return "tokens_left";
		} 
		if( param.equals( "X-ERA-error" ) ){
			return "error";
		}
		if( param.equals( "X-ERA-cost" ) ){
			return "cost";
		}
		if(param.equals("X-ERA-counter")){
			return "counter";
		}
		return param;
	}
}
