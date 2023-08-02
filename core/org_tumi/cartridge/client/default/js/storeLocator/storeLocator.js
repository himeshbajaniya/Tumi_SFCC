'use strict';

function DOMLocCreate(data) {
   var directionUrl = 'https://maps.google.com/?daddr='+ data.store.latitude + ',' + data.store.longitude;
   var storeDetailUrk = 'https://www.tumi.com/store/'+ data.store.ID
   var list = "";
   list += `
    <div class="row">
    <div class="col-sm-6 text-content d-flex flex-column align-items-center justify-content-center order-2 order-sm-2 order-md-1"tabindex="0">
       <div class="title"tabindex="0">${data.getResources.storeHeading}</div>
       <h4 class="store-location" id="store-location"tabindex="0">${data.store.name}</h4>`;
       if(data.storeDistance <= 1) {
       list += `<p class="store-distance" id="store-distance"tabindex="0"> 
       <a class="mile-distance" href="javascript:void(0)">${data.storeDistance} mile away </a>
      •  Open now until ${data.openUntil}PM today
       </p>`;
       }
      else if(data.storeDistance > 1 ) {
         list += `<p class="store-distance" id="store-distance"tabindex="0"> 
         <a class="mile-distance" href="${directionUrl}" target="_blank">${data.storeDistance} miles away</a>
         •  Open now until ${data.openUntil}PM today
         </p>`;
         }
       else{
         list += `<p tabindex="0">Open now until ${data.openUntil}PM today</p>`;
       }
       list += `<a class="button button--primary appointment" href="${storeDetailUrk}">${data.getResources.storescheduleAppointment}</a>
       <a class="button button--secondary call-us" href="tel:${data.store.phone}">Call us at ${data.store.phone}</a>
    </div>
    <div class="col-sm-6 store-img order-1 order-sm-1 order-md-2">
       <img class="home-store-image" src="${data.store.largeImage}"/>
    </div>
 </div>
   `;
   return list;
}

function DOMNoLocCreate(data) {
   return `
    <div class="row">
    <div class="col-sm-6 text-content d-flex flex-column align-items-center justify-content-center order-2 order-sm-2 order-md-1">
       <h5 class="title"tabindex="0">${data.getResources.nostoreHeading}</h5>
       <h4 class="store-location"tabindex="0">${data.getResources.nostoreLocation}</h4>
       <p class="store-distance"tabindex="0">${data.getResources.nostoreDescription}</p>
       <a class="button button--primary find-store" href="${data.storeLocatorUrl}">${data.getResources.nostoreButtonFindStore}</a>
    </div>
    <div class="col-sm-6 store-img order-1 order-sm-1 order-md-2">
       <img class="home-store-image" src="${data.getResources.nostoreLargeImage}"/>
    </div>
 </div>
`;
}

function DOMCreateFooterStore(data) {
   var storeDetailUrk = 'https://www.tumi.com/store/'+ data.store.ID
   var storeHtml = `
<div class="col-md-12 col-sm-6 col-12 mb-3">
   <div class="store-image">
   <img src="${data.store.headerFooterImage}" alt="Store Image"/>
   </div>
</div>
<div class="col-md-12 col-sm-6 col-12">
   <div class="footer-store-info-details">
      <div class="address">
         <p class="title">
           ${data.store.name}
           <a href="${data.storeLocatorUrl}">change</a>
         </p>
         <p>${data.store.address1}</p><p>`
         if(data.store.address2){
            storeHtml += data.store.address2 + ', '
         }
         storeHtml += `${data.store.city} ${data.store.postalCode}</p>
         <p>${data.store.phone}</p>
      </div>
      <div class="store-cta">
      <a href="${data.storeLocatorUrl}">
      ${data.getResources.storescheduleAppointment}
      </a>
      <a>
      ${data.getResources.headerGetDirection}
      </a>
      <a href="${storeDetailUrk}" class="button d-block button--secondary-dark">${data.getResources.storescheduleAppointment}</a>
      </div>
   </div>
</div>
`;
   return storeHtml;
}

function DOMCreateNoFooterStore(data) {
   return `
    <div class="col-md-12 col-sm-6 col-12 mb-3">
       <div class="store-image">
       <img src="${data.getResources.nostoreImage}" alt="Store Image"/>
       </div>
    </div>
    <div class="col-md-12 col-sm-6 col-12">
       <div class="footer-store-info-details">
          <div class="address">
            <h4 class="title">${data.getResources.nostoreLocation}</h4>
             <p>${data.getResources.nostoreDescription}</p>
          </div>
          <div class="store-cta">
          <a href="${data.storeLocatorUrl}">
          ${data.getResources.nostoreButtonFindStore}
      </a>
             <a href="${data.storeLocatorUrl}" class="button button--secondary-dark">${data.getResources.nostoreButtonFindStore}</a>
          </div>
       </div>
    </div>
    `
}

function DOMCreateHeaderStore(data) {
   var directionUrl = 'https://maps.google.com/?daddr='+ data.store.latitude + ',' + data.store.longitude;
   var storeDetailUrk = 'https://www.tumi.com/store/'+ data.store.ID
   var list = "";
   list += `
    <h3 class="d-none d-md-block">${data.getResources.headerStoreHeading}</h3>
    <img src="${data.store.headerFooterImage}" alt="Store Image"/>
    <div class="address pb-3">
       <p class="title">
          ${data.store.name}
          <a href="${data.storeLocatorUrl}">change</a>
       </p>`;
       if(data.storeDistance <= 1 ) {
         list += `<p class="store-distance" id="store-distance"> ${data.storeDistance} mile away</p>
         <p>Open now until ${data.openUntil}PM today</p>`;
         }
        else if(data.storeDistance > 1 ) {
            list += `<p class="store-distance" id="store-distance"> ${data.storeDistance} miles away</p>
            <p>Open now until ${data.openUntil}PM today</p>`;
            }
         else{
           list += `<p>Open now until ${data.openUntil}PM today</p>`;
         }
         list +=`
    </div>
    <a href="${storeDetailUrk}" class="button d-block button--primary">
    ${data.getResources.storescheduleAppointment}
    </a>
    <a href="${directionUrl}" target="_blank" class="button d-block button--secondary">
    ${data.getResources.headerGetDirection}
    </a>
      `;
      return list;
}

function DOMCreateNoHeaderStore(data) {
   return `
   <h3 class="d-none d-md-block">${data.getResources.headerStoreHeading}</h3>
   <img src="${data.getResources.nostoreImage}" alt="Store Image"/>
   <div class="address pb-3">
      <p class="title">
         ${data.getResources.nostoreLocation}
      </p>
      <p>${data.getResources.nostoreDescription}</p>
   </div>
   <a href="${data.storeLocatorUrl}" class="button d-block button--primary">
   ${data.getResources.nostoreButtonFindStore}
   </a>
     `;
}

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

function geoSuccess(position) {
    var url = $('#storeurl').val();
    var radius = $('#storeSearchRadius').val();
    var geoPosition = {
      coords: {
         latitude: position.coords.latitude,
         longitude: position.coords.longitude
      }
    }
    sessionStorage.setItem('geoPosition', JSON.stringify(geoPosition));
    var urlParams = {
        locationEnabled: true,
        radius: radius,
        lat: position.coords.latitude,
        long: position.coords.longitude
    };

    url = appendToUrl(url, urlParams);
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            if (data.store && data.store.ID) {
                $('#home-your-store').html(DOMLocCreate(data));
                $('#footer-store-info').html(
                    DOMCreateFooterStore(data)
                );
                $('#header-store-loc').html(DOMCreateHeaderStore(data));
            } else {
                $('#home-no-store').html(DOMNoLocCreate(data));
                $('#footer-store-info').html(
                    DOMCreateNoFooterStore(data)
                );
                $('#header-store-loc').html(DOMCreateNoHeaderStore(data));
            }
        }
    });
}

function geoError() {
    var url = $('#storeurl').val();
    var urlParams = {
        locationEnabled: false
    };
    url = appendToUrl(url, urlParams);

    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            if (data.store && data.store.ID) {
                $('#home-your-store').html(DOMLocCreate(data));
                $('#footer-store-info').html(
                    DOMCreateFooterStore(data)
                );
                $('#header-store-loc').html(DOMCreateHeaderStore(data));
            } else {
                $('#home-no-store').html(DOMNoLocCreate(data));
                $('#footer-store-info').html(
                    DOMCreateNoFooterStore(data)
                );
                $('#header-store-loc').html(DOMCreateNoHeaderStore(data));
            }
            
        }
    });
}

/**
 * Renders the results of the search and updates the map
 * @param {Object} data - Response from the server
 */
 function updateStoresResults(data) {
   var $resultsDiv = $('.results');
   var $mapDiv = $('.map-canvas');
   var hasResults = data.stores.length > 0;

   if (!hasResults) {
       $('.store-locator-no-results').show();
   } else {
       $('.store-locator-no-results').hide();
   }

   $resultsDiv.empty()
       .data('has-results', hasResults)
       .data('radius', data.radius)
       .data('search-key', data.searchKey);

   $mapDiv.attr('data-locations', data.locations);

   if ($mapDiv.data('has-google-api')) {
      loadMaps();
   } else {
       $('.store-locator-no-apiKey').show();
   }

   if (data.storesResultsHtml) {
       $resultsDiv.append(data.storesResultsHtml);
   }
}

/**
 * Uses google maps api to render a map
 */
 function loadMaps() {
   var map;
   var infowindow = new google.maps.InfoWindow();

   // Init U.S. Map in the center of the viewport
   var latlng = new google.maps.LatLng(37.09024, -95.712891);
   var mapOptions = {
       scrollwheel: false,
       zoom: 5,
       center: latlng
   };

   map = new google.maps.Map($('.map-canvas')[0], mapOptions);
   var mapdiv = $('.map-canvas').attr('data-locations');
   mapdiv = JSON.parse(mapdiv);

   var bounds = new google.maps.LatLngBounds();
   var $storeDetails = $('.map-canvas'); 
   const icons = {
      retail: $storeDetails.data('tumistore'),
      outlet: $storeDetails.data('tumioutlet'),
      dealer: $storeDetails.data('tumiretaiil')
    };

   Object.keys(mapdiv).forEach(function (key) {
       var item = mapdiv[key];
       var storeIcon = icons[item.storeType ? item.storeType.toLowerCase() : 'dealer'];
       if(!storeIcon) {
         storeIcon = icons.dealer;
       }
       var storeLocation = new google.maps.LatLng(item.latitude, item.longitude);
       var marker = new google.maps.Marker({
           position: storeLocation,
           map: map,
           title: item.name,
           icon: storeIcon
       });

       marker.addListener('click', function () {
           infowindow.setOptions({
               content: item.infoWindowHtml
           });
           infowindow.open(map, marker);
       });

       // Create a minimum bound based on a set of storeLocations
       bounds.extend(marker.position);
   });
   // Fit the all the store marks in the center of a minimum bounds when any store has been found.
   if (mapdiv && mapdiv.length !== 0) {
       map.fitBounds(bounds);
   }
}

function geoCodeAddress(element) {
   var dialog = element.closest('.in-store-inventory-dialog');
   var spinner = dialog.length ? dialog.spinner() : $.spinner();
   spinner.start();
   var $form = element.closest('.store-locator');
   var radius = $("#storeSearchRadius").val();
   var url = $form.attr('action');
   var urlParams = { radius: radius };
   var method = $form.attr('method')
   var address = $form.find('[name="postalCode"]').val();
   url = appendToUrl(url, urlParams);

   var geocoder = new google.maps.Geocoder();
   geocoder.geocode( {address:address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
         var latitude = results[0].geometry.location.lat();
         var longitude = results[0].geometry.location.lng();
         var payload = { lat: latitude,long: longitude};

         $.ajax({
            url: url,
            type: method,
            data: payload,
            dataType: 'json',
            success: function (data) {
                spinner.stop();
                updateStoresResults(data);
                $('.select-store').prop('disabled', true);
            }
        });
        return false;
      }
   });
}
function storeUpdate(storeId) {
   var url = $('#save-my-store-url').val();
   $.ajax({
      url: url,
      type: 'POST',
      data: {
         storeId: storeId
      },
      success: function (data) {
         if (data.success) {
            $("[for^=store_]").text('Save as My Store');
            $("[for=store_" + storeId + "]").text('My Store');
         }
         localStorage.removeItem('currentStoreID');
         $.spinner().stop();
      }
   });
}
module.exports = {
   init: function () {
      if ($('.map-canvas').data('has-google-api')) {
         loadMaps();
      } else {
          $('.store-locator-no-apiKey').show();
      }
   
      if (!$('.results').data('has-results')) {
          $('.store-locator-no-results').show();
      }
   },
   detectLocation: function () {
      $('.detect-location').on('click', function () {
          $.spinner().start();
          navigator.geolocation.getCurrentPosition(function (position) {
              var $detectLocationButton = $('.detect-location');
              var url = $detectLocationButton.data('action');
              var radius = $('.results').data('radius');
              var urlParams = {
                  radius: radius,
                  lat: position.coords.latitude,
                  long: position.coords.longitude
              };

              url = appendToUrl(url, urlParams);
              $.ajax({
                  url: url,
                  type: 'get',
                  dataType: 'json',
                  success: function (data) {
                      $.spinner().stop();
                      updateStoresResults(data);
                      $('.select-store').prop('disabled', true);
                  }
              });
          }, 
          function (){
            $.spinner().stop();
            return;
          });
      });
  },
   updateMyStore: function () {
      $(document).on('storelocator:add', function () {
         var wid = localStorage.getItem('currentStoreID') || '';
         if (wid !== '' && wid !== null) {
            storeUpdate(wid);
         }
      });

      $(document).on('change', "input[name=my-store]:radio", function (e) {
         var current = e.currentTarget;
         var storeId = this.value;
         var isLoggedIn = false;
         var loggedInStatusURL = $('#pageHeader').data('loggedinstatusurl');
         $.get(loggedInStatusURL).done(function (data) {
            isLoggedIn = data.isAuthenticated;
            if (isLoggedIn) {
               $('body').spinner().start();
               storeUpdate(storeId);
            } else {
               $('#requestLoginModal').find('.login-info').addClass('d-none');
               $('#requestLoginModal').modal('show');
               localStorage.setItem('currentStoreID', current.value);
            }
         });
      });
   },
   search: function () {
      $('.store-locator-container form.store-locator').submit(function (e) {
          e.preventDefault();
          geoCodeAddress($(this));
      });
   },
   storeLocator: function () {
      var storeEle = ($('#storeurl').length > 0);
      var geoPosition = JSON.parse(sessionStorage.getItem('geoPosition'));
      if(storeEle && geoPosition === null) {
         navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
      }      
      else {
         geoSuccess(geoPosition)
      }
   },
   ToggleStoreDetails: function() {
      $(document).on('click', '.store-locator-container #view-store-details, .map-canvas #view-store-details', function(e) {
         var storeId = $(this).data('store-id');
         $('#view-store-details').toggleClass('icon');
         var $storeContainer = $('.store-locator-container .store-timing-section_'+ storeId);
         if ($(this).parents('.map-canvas').length > 0) {
            $storeContainer = $('.map-canvas .store-timing-section_'+ storeId);
         }
         $storeContainer.toggleClass('d-block');
         if($storeContainer.hasClass('d-block')) {
            this.textContent = 'Hide Details ';
         } else {
            this.textContent = 'View Details ';
         }
         e.preventDefault();
      });
   }
};