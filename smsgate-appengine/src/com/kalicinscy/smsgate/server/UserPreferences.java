package com.kalicinscy.smsgate.server;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.jdo.JDOObjectNotFoundException;
import javax.jdo.PersistenceManager;
import javax.jdo.Query;
import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.IdentityType;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.users.User;


/**
 * User preferences.
 * @author jarrod
 *
 */
@PersistenceCapable(identityType = IdentityType.APPLICATION)
public class UserPreferences {
	
	/**
	 * Table Key
	 * Key value: user-ID + # + gate type eg: user@domain.com#era_PL
	 * User ID is account ID from google account
	 * or hash from user email for OpenID
	 * Preferences are stored for each user.
	 * User can have only one preferences for one type.
	 */
	@PrimaryKey
	@Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY)
    private Key key;
	
	/**
	 * User object
	 */
	@Persistent
    private User user;
	/**
	 * Updated time.
	 * If update time is different in browser then browser
	 * should  update data
	 */
	@Persistent
    private Date updateTimestamp;
	
	/**
	 * Typ bramki SMS.
	 * Aktualnie tylko bramka sieci ERA.
	 * 
	 * 
	 */
	@Persistent
	private String gateType;
	/**
	 * Login do bramki SMS.
	 */
	@Persistent
	private String gateLogin;
	/**
	 * Hasło bramki SMS
	 */
	@Persistent
	private String gatePassword;
	/**
	 * Domyślnie zapisuje w historii
	 * Domyśln wartość to true;
	 */
	@Persistent
	private boolean defaultHistory;
	/**
	 * Bramka ery ma dwie wersje: płatną i sponsorowaną.
	 * W zależności od ustawień pod taką bramkę wysyłane są wiadomości.
	 * Zmienna to nazwa typu brmki po stronie providera.
	 */
	@Persistent
	private String gateInnerType;
	
	@Persistent
	private boolean synchGmail;
	
	public UserPreferences(User user){
		this.setUser(user);
		this.setGateLogin(null);
		this.setGatePassword(null);
		this.setUpdateTimestamp( new Date() );
		this.setDefaultHistory(true);
		this.setSynchGmail( false );
		this.setGateType( GateType.ERA_PL );
	}
	
	
	public UserPreferences(User user, String login, String password){
		this.setUser(user);
		this.setGateLogin(login);
		this.setGatePassword(password);
		this.setUpdateTimestamp( new Date() );
		this.setDefaultHistory(true);
		this.setSynchGmail( false );
		this.setGateType( GateType.ERA_PL );
	}

	public void setKey(Key key) {
		this.key = key;
	}

	public Key getKey() {
		return key;
	}

	public void setUpdateTimestamp(Date updateTimestamp) {
		this.updateTimestamp = updateTimestamp;
	}

	public Date getUpdateTimestamp() {
		return updateTimestamp;
	}
	
	public void setDefaultHistory(boolean defaultHistory) {
		this.defaultHistory = defaultHistory;
	}

	public boolean isDefaultHistory() {
		return defaultHistory;
	}

	public void setGatePassword(String gatePassword) {
		this.gatePassword = gatePassword;
	}

	public String getGatePassword() {
		return gatePassword;
	}

	public void setGateLogin(String gateLogin) {
		this.gateLogin = gateLogin;
	}

	public String getGateLogin() {
		return gateLogin;
	}

	public void setGateType(String gateType) {
		this.gateType = gateType;
	}

	public String getGateType() {
		return gateType;
	}

	public void setUser(User user) {
		this.user = user;
	}


	public User getUser() {
		return user;
	}

	public static class GateType {
		private GateType(){}
		
		public static final String ERA_PL = "era_PL";
	}
	/**
	 * Get all users gates configurations
	 * @param pm
	 * @param user
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public static List<UserPreferences> getUserGates(PersistenceManager pm, User user){
		
		Query query = pm.newQuery(UserPreferences.class, "user == u");
		query.declareParameters("com.google.appengine.api.users.User u");
		List<UserPreferences> res = (List<UserPreferences>) query.execute(user);
		List<UserPreferences> copyresult = new ArrayList<UserPreferences>();
		for(UserPreferences up : res){
			copyresult.add( up );
		}
		query.closeAll();
		return copyresult;
	}
	/**
	 * Get user's gate configuration
	 * @param pm
	 * @param user
	 * @param type String value from {@link UserPreferences.GateType} 
	 * @return Gate configuration or null if none exist.
	 */
	public static UserPreferences getUserGate(PersistenceManager pm, User user, String type) {
		String uid = user.getUserId();
		if( uid == null ){
			//@TODO id openid create hashed ID from email with salt
			return null;
		}
		String keyName = uid + "#" + type;
		UserPreferences userdata = null;
		try{
    		userdata = pm.getObjectById(UserPreferences.class,keyName);
    	} catch( JDOObjectNotFoundException e ){}
    	return userdata;
	}


	public void setSynchGmail(boolean synchGmail) {
		this.synchGmail = synchGmail;
	}


	public boolean isSynchGmail() {
		return synchGmail;
	}


	/**
	 * @param gateInnerType the gateInnerType to set
	 */
	public void setGateInnerType(String gateInnerType) {
		this.gateInnerType = gateInnerType;
	}


	/**
	 * @return the gateInnerType
	 */
	public String getGateInnerType() {
		return gateInnerType;
	}
}
