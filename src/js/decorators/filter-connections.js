var dom = require( 'helpers/dom' );
var ui = require( 'helpers/ui' );
var fireGAEvent = require( 'helpers/fireGAEvent' );

module.exports = function( element ) {
  var form = element.form;
  var url = 'https://' + NLX.auth0_domain + '/public/api/' + form.webAuthConfig.clientID + '/connections';
  var visualStatusReport = document.getElementById( 'loading__status' );
  var willRedirect = false;

  ui.setLockState( element, 'loading' );

  fetch( url ).then( function( response ) {
    return response.json();
  }).then( function( allowed ) {
    var allowedRPs = [];
    var RPfunctionalities = dom.$( '[data-optional-rp]' );
    var i;

    for ( i = 0; i < allowed.length; i++ ) {
      allowedRPs.push( allowed[i].name );
    }

    RPfunctionalities.forEach( function( functionality ) {
      var functionalityName = functionality.getAttribute( 'data-optional-rp' );
      var lastUsedConnection;
      var locationString;
      var silentAuthEnabled;
      var newLocation;

      if ( allowedRPs.indexOf( functionalityName ) === -1 ) {
        ui.hide( functionality );
        fireGAEvent( 'Hiding', 'Hiding login method that isn\'t supported for this RP' );
      }

      if ( window.location.hostname !== 'localhost' && window.localStorage ) {
        lastUsedConnection = window.localStorage.getItem( 'nlx-last-used-connection' );
        locationString = window.location.toString();
        silentAuthEnabled = locationString.indexOf('tried_silent_auth=true') === -1;

        if ( silentAuthEnabled && lastUsedConnection && allowedRPs.indexOf( lastUsedConnection ) >= 0 ) {
          willRedirect = true;
          visualStatusReport.textContent = 'Autologging in with ' + lastUsedConnection;

          setTimeout( function() {
            newLocation = locationString.replace( '/login?', '/authorize?' ).replace( '?client=', '?client_id=' ) + '&sso=true&connection=' + lastUsedConnection + '&tried_silent_auth=true';
            window.location.replace( newLocation );
            fireGAEvent( 'Authorisation', 'Performing auto-login with ' + lastUsedConnection );
          }, 1000 );
        }
      }
    });

    if ( !willRedirect ) {
      ui.setLockState( element, 'initial' );
    }
  });
};
