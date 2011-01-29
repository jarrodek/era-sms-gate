package com.kalicinscy.smsgate.client;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.user.client.History;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.DialogBox;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class GateWebsite implements EntryPoint, ValueChangeHandler<String> {
	/**
	 * @wbp.parser.entryPoint
	 */
	public void onModuleLoad() {
		
//		if( true ){
//			Window.Location.assign( GWT.getHostPageBaseURL() + "index.html" );
//			return;
//		}
		
		History.addValueChangeHandler( this );
		History.fireCurrentHistoryState();
		
		
		
//		VerticalPanel verticalPanel = new VerticalPanel();
//		rootPanel.add(verticalPanel, 0, 0);
//		verticalPanel.setSize("100%", "100%");
//		
//		HorizontalPanel horizontalPanel = new HorizontalPanel();
//		verticalPanel.add(horizontalPanel);
//		horizontalPanel.setWidth("100%");
//		
//		Image image = new Image("images/icon_128.png");
//		horizontalPanel.add(image);
//		
//		HTML mainTitle = new HTML("<h1>Bramka Era SMS</h1>", true);
//		mainTitle.setStyleName("mainTitle");
//		horizontalPanel.add(mainTitle);
//		
//		Label lblTaStronaJest = new Label("Ta strona jest stroną plikacji używaną przez rozszerzenie. Przejdź do właściwej strony z informacjami na temat rozszerzenia pod adresem: ");
//		verticalPanel.add(lblTaStronaJest);
//		
//		Hyperlink blogAnchor = new Hyperlink("http://bramka-era.blogspot.com/", false, "");
//		verticalPanel.add(blogAnchor);
	}

	/**
	 * @wbp.parser.entryPoint
	 */
	@Override
	public void onValueChange(ValueChangeEvent<String> event) {
		String hash = event.getValue();
		if( hash.equals( "loginInterupted" ) ){
			final DialogBox dialog = new DialogBox(true, true);
			dialog.setAnimationEnabled(true);
			dialog.setGlassEnabled(true);
			
			dialog.setHTML("<b>Logowanie zostało anulowane.</b><br/>Aby ponownie się zalogować kliknij ikonę rozszerzenia.");
			//dialog.setSize("261px", "182px");
			
			Button ok = new Button("OK");
			ok.addClickHandler(new ClickHandler() {

				@Override
				public void onClick(ClickEvent event) {
					dialog.hide();
				}
				
			});
			ok.setSize("100%", "100%");
			dialog.setWidget(ok);
			dialog.show();
			dialog.center();
		}
	}
}
