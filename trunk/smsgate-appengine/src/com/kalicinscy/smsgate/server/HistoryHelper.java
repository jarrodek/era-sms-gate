package com.kalicinscy.smsgate.server;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import javax.jdo.PersistenceManager;

import com.google.appengine.api.users.User;
import com.kalicinscy.smsgate.server.UserHistory;

public class HistoryHelper {
	private HistoryHelper(){}
	/**
	 * Zapisanie wiadomości w historii
	 * @param body treść wiadomości
	 * @param cost koszt wysłania (liczbowa reprezentacja dowolnej jednostki (zależna od bamki)
	 * @param gateType typ bramki {@link UserPreferences.GateType}
	 * @param recipient odbiorca wiadomości
	 * @param sender jeśli dostępne to numer nadawcy.
	 * @param browserID ID przeglądarki jeśli dostępne. MOŻE BYĆ NULL!
	 */
	public static String insertHistory(final String body, final int cost, final String gateType, 
			final String recipient, final String sender, String browserID){
		
		String hashStr = body+"#"+gateType+"#"+recipient;
		String hash = null;
		try {
			MessageDigest md = MessageDigest.getInstance("MD5");
			byte[] data = hashStr.getBytes("UTF-8");
			md.update( data, 0, data.length );
			BigInteger i = new BigInteger(1,md.digest());
			//m.update(data,0,data.length);
			hash = String.format("%1$032X", i);
		} catch (NoSuchAlgorithmException e1) {
		} catch (UnsupportedEncodingException e) {
		}
		
		UserHistory uh = new UserHistory();
		uh.setBody(body);
		uh.setCost(cost);
		User usr = null;
		try{
			usr = ConfigHelper.getAppUser();
		} catch(IOException e){}
		uh.setUser(usr);
		uh.setGateType(gateType);
		uh.setRecipient(recipient);
		uh.setSender(sender);
		uh.setHash( hash );
		if( browserID != null ){
			uh.setBrowserId(browserID);
		}
		
		PersistenceManager pm = HistoryHelper.getPersistenceManager();
		
		try {
            pm.makePersistent( uh );
		}catch (Exception e){
			return null;
        } finally {
            pm.close();
        }
		return hash;
	}
	
	
	public static PersistenceManager getPersistenceManager() {
		return PMF.get().getPersistenceManager();
	}
}
