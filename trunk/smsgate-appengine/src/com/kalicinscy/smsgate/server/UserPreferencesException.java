package com.kalicinscy.smsgate.server;

import java.io.Serializable;

public class UserPreferencesException extends Exception implements Serializable {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = -1320549025951402563L;

	public UserPreferencesException() {
		super();
	}

	public UserPreferencesException(String message) {
		super(message);
	}
}
