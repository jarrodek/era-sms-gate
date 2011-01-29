package com.kalicinscy.smsgate.server;

public enum Status {
	OK (200,"OK"),
	ERROR_USER_NOT_LOGGED_IN (100,"user_not_logged_in"),
	ERROR_USER_PREFERENCES_MISSING (101,"user_preferences_missing"),
	ERROR_GENERAL (102,"general_error"),
	ERROR_SAVE_DATABASE (103,"error_save_database"),
	ERROR_EXT_SERVER_RESPONSE (104,"error_ext_srv_resp");
	
	private int code;
	private String message;

	Status (int code, String value){
		this.code = code;
		this.message = value;
	}

	public int getCode() {
		return this.code;
	}
	public String getMessage(){
		return this.message;
	}
}
