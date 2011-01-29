package com.kalicinscy.smsgate.server;

import java.io.Serializable;

public class NotLoggedInException extends Exception implements Serializable {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = -1320549025951402563L;

	public NotLoggedInException() {
		super();
	}

	public NotLoggedInException(String message) {
		super(message);
	}
}
