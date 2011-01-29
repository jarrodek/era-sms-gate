package com.kalicinscy.smsgate.server;

import java.util.Date;
import java.util.List;

import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Cursor;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.PhoneNumber;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.QueryResultList;
import com.google.appengine.api.users.User;

import static com.google.appengine.api.datastore.FetchOptions.*;


@PersistenceCapable
public class UserHistory {
	/**
	 * Table Key
	 * Auto-generated
	 * 
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
	 * Message recipient number.
	 */
	@Persistent
    private PhoneNumber recipient;
	
	/**
	 * Message sender number (if available).
	 */
	@Persistent
    private PhoneNumber sender = null;
	
	/**
	 * The message
	 */
	@Persistent
    private String body;
	/**
	 * Sata wysłania wiadomości
	 */
	@Persistent
	private Date sentTimestamp;
	
	/**
	 * Typ bramki SMS.
	 * Aktualnie tylko bramka sieci ERA.
	 * 
	 * 
	 */
	@Persistent
	private String gateType;
	
	/**
	 * Koszt wysłania wiadomości.
	 * 
	 * 
	 */
	@Persistent
	private int cost;
	/**
	 * Hash używany do synchronizacji
	 */
	@Persistent
	private String hash;
	
	/**
	 * ID przeglądarki, z której wysłano SMS-a.
	 * Od wersji 2.0 rozszerzenia każda przegląarka generuje własny ID
	 * W późniejszych updateach rozszerzenie w historii będzie pokazywać 
	 * z której przeglądarki wysłano wiadomość.
	 */
	@Persistent
	private String browserId;
	
	
	public UserHistory(Key key){
		this.setKey(key);
		this.setSentTimestamp( new Date() );
		this.setCost(0);
		this.setBody("");
	}
	
	public UserHistory(){
		this.setSentTimestamp( new Date() );
		this.setCost(0);
		this.setBody("");
	}
	
	
	/**
	 * @param key the key to set
	 */
	public void setKey(Key key) {
		this.key = key;
	}

	/**
	 * @return the key
	 */
	public Key getKey() {
		return key;
	}

	/**
	 * @param user The user to set
	 */
	public void setUser(User user) {
		this.user = user;
	}

	/**
	 * @return the user
	 */
	public User getUser() {
		return user;
	}

	/**
	 * @param recipient the recipient to set
	 */
	public void setRecipient(String recipient) {
		this.recipient = new PhoneNumber(recipient);
	}

	/**
	 * @return the recipient
	 */
	public String getRecipient() {
		return recipient.getNumber();
	}

	/**
	 * @param body the body to set
	 */
	public void setBody(String body) {
		this.body = body;
	}

	/**
	 * @return the body
	 */
	public String getBody() {
		return body;
	}

	/**
	 * @param sentTimestamp the sentTimestamp to set
	 */
	public void setSentTimestamp(Date sentTimestamp) {
		this.sentTimestamp = sentTimestamp;
	}

	/**
	 * @return the sentTimestamp
	 */
	public Date getSentTimestamp() {
		return sentTimestamp;
	}

	/**
	 * @param gateType the gateType to set
	 */
	public void setGateType(String gateType) {
		this.gateType = gateType;
	}

	/**
	 * @return the gateType
	 */
	public String getGateType() {
		return gateType;
	}

	/**
	 * @param cost the cost to set
	 */
	public void setCost(int cost) {
		this.cost = cost;
	}

	/**
	 * @return the cost
	 */
	public int getCost() {
		return cost;
	}

	/**
	 * @param sender the sender to set
	 */
	public void setSender(String sender) {
		this.sender = new PhoneNumber(sender);
	}

	/**
	 * @return the sender
	 */
	public String getSender() {
		return sender.getNumber();
	}
	
	public static QueryResultList<Entity> getUserHistory(String cursor, User user){
		return getUserHistory(cursor, user, 0, null);
	}
	public static QueryResultList<Entity> getUserHistory(String cursor, User user, long fromTime){
		return getUserHistory(cursor, user, fromTime, null);
	}
	
	
	public static QueryResultList<Entity> getUserHistory(String cursor, User user, long fromTime, String gateType){
		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
		
		int pageSize = 50;
		
		com.google.appengine.api.datastore.Query q = new com.google.appengine.api.datastore.Query( "UserHistory" );
		q.addFilter("user", com.google.appengine.api.datastore.Query.FilterOperator.EQUAL, user);
		q.addFilter("sentTimestamp", com.google.appengine.api.datastore.Query.FilterOperator.GREATER_THAN, new Date( (fromTime*1000) ));
		
		if( gateType != null ){
			q.addFilter("gateType", com.google.appengine.api.datastore.Query.FilterOperator.EQUAL, gateType);
		}
		q.addSort("sentTimestamp", SortDirection.ASCENDING );
		PreparedQuery pq = datastore.prepare(q);
		
		FetchOptions fetchOptions = Builder.withLimit(pageSize);
		int resultOffset = 0;
		
		if (cursor != null) {
            fetchOptions.startCursor(Cursor.fromWebSafeString(cursor));
            
            if( fetchOptions.getOffset() == null ){
            	resultOffset = pageSize;
            } else {
            	resultOffset = (fetchOptions.getOffset().intValue() + pageSize);
            }
        }
		fetchOptions.offset( resultOffset );
		return pq.asQueryResultList(fetchOptions);
	}
	public static QueryResultList<Entity> getUserHistory(String cursor, User user, String gateType){
		return getUserHistory(cursor, user, 0, gateType);
	}
	
	public static List<Entity> getHistoryByHash(String hash, User user){
		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
		Query q = new Query("UserHistory");
		q.addFilter("hash", com.google.appengine.api.datastore.Query.FilterOperator.EQUAL, hash);
		q.addFilter("user", com.google.appengine.api.datastore.Query.FilterOperator.EQUAL, user);
		PreparedQuery pq = datastore.prepare(q);
		FetchOptions fetchOptions = Builder.withLimit(1);
		
		return pq.asList(fetchOptions);
	}
	

	/**
	 * @param hash the hash to set
	 */
	public void setHash(String hash) {
		this.hash = hash;
	}

	/**
	 * @return the hash
	 */
	public String getHash() {
		return hash;
	}

	/**
	 * @param browserId the browserId to set
	 */
	public void setBrowserId(String browserId) {
		this.browserId = browserId;
	}

	/**
	 * @return the browserId
	 */
	public String getBrowserId() {
		return browserId;
	}
}
