package com.kalicinscy.smsgate.server;

import java.io.IOException;
import javax.servlet.http.*;

@SuppressWarnings("serial")
public class Era_Sms___AppEngineServlet extends HttpServlet {
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		resp.setContentType("text/plain");
		resp.getWriter().println("Hello, world");
	}
}
