var map,
    google_restaurants = [],
    google_restaurants_test = [],
    myCurrentLocation,
    marker,
    markersArray = {},
    circle,
    infoWindow,
    routesDisplay,
    defaultRadius = 4000,
    cebuLat = 10.31672,
    cebuLng = 123.89071,
    defaultPlace = {lat: cebuLat, lng: cebuLng},
    defaultTravelMode = 'WALKING'
    total_restaurants = 0,
    total_customers_visit = 0,
    total_sales = 0,
    total_expenses = 0
    report = 'Analytics report as of 2017: <br>';

// available restaurant types on Cebu
var available_types = ['cafe','restaurant','bar'];
// deprecated ,'food'

//===================Note=====================
//As ive checked Cebu's restaurants most of the it don't have specialty
//===================End======================
/*
    Initialize map
*/
function initMap(request = null) {
    // Cebu
    var location = defaultPlace;

    // map
    map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 14
    });

    // get user location
    getMyCurrentLocation();

    if (!request) {
        request = {
            location: myCurrentLocation,
            radius: defaultRadius,
            type: ['restaurant'],
        };
    };

    getAllRestaurants(request);

    // Init drawing google map drawing
    initCircle();

    // init directions renderer
    routesDisplay = new google.maps.DirectionsRenderer({
        map: map
    });
}

/*
    Get default current location
*/
function getMyCurrentLocation() {
    // this is Cebu capitol
    myCurrentLocation = new google.maps.LatLng(cebuLat, cebuLng);

    // mark: Cebu Capitol
    var my_marker = new google.maps.Marker({
        map: map,
        position: myCurrentLocation,
    });

    // add hover listener on marker
    google.maps.event.addListener(my_marker, 'mouseover', function() {
        infoWindow.setContent('<div><b>My location</b><br>Cebu Provincial Capitol</div>');
        infoWindow.open(map, this);
    });
}

var restoSpecialtyArr = ['Sushi','Chicken','Lechon','Chicken','Bulalo','Pares','Chicken Diablo','Pancit Malabon','Cordon Bleu','Burger Stunner','Pizza','Lugaw']
var restaurantTypesArr = ['fine dining', 'casual dining', 'bakeshop','restaurants','family style','cafe'];

// get restaurants from google
function getAllRestaurants(request) {
    //init Place service - get all type restaurants
    service = new google.maps.places.PlacesService(map);
    total_restaurants = 0;

    service.nearbySearch(
        request
        , function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {

            for (var i = 0; i < results.length; i++) {

                randomIndex = Math.floor((Math.random() * 10) + 1);
                randomIndexRestoTypes = Math.floor((Math.random() * 6) + 1);
                randomCustomerVisits = Math.floor((Math.random() * 9999) + 1);
                randomExpenses = Math.floor((Math.random() * 99999999) + 1);
                randomSales = Math.floor((Math.random() * 999999999) + 1);

                additionalInfo = {
                    "types":restaurantTypesArr[randomIndexRestoTypes],
                    "specialty":restoSpecialtyArr[randomIndex],
                    "analytics":{
                        "2017":{
                            "customer_visit":randomCustomerVisits,
                            "expenses":randomExpenses,
                            "sales":randomSales
                        }
                    }
                };

                google_restaurants.push({"result":results[i],"additionalInfo":additionalInfo});
                total_restaurants++;
            }

            $('#total_restaurants').html(total_restaurants);
            getPlaces();
        }
    });
}

/*
    Create marker: points requested types/name
*/
function createMarker(place, additionalInfo) {
    var icon = {
        url: place.icon,
        scaledSize: new google.maps.Size(25, 25),
    };

    var specialty   = '',
        rating      = '',
        opening     = '';

    // init instance for marker
    marker = new google.maps.Marker({
        icon: icon,
        map: map,
        position: place.geometry.location,
    });

    marker.id = place.id;
    marker.name = place.name;
    // push marker to array
    markersArray[place.id] = marker;

    // restaurants list
    listAllRestaurants(marker,additionalInfo);

    // init an instance of info window
    infoWindow = new google.maps.InfoWindow();

    // set place.* attributes
    if (additionalInfo.specialty) {
        specialty = 'Specialty : ' + additionalInfo.specialty + '<br>';
    }

    if (place.rating) {
        rating = 'Rating : ' + place.rating + '<br>';
    }

    if (place.opening_hours) {
        if (place.opening_hours.open_now) {
            opening = '<b>Status: <span style="color: #00b200;">Open</span></b><br>';
        } else {
            opening = '<b>Status: <span style="color: #ad000b;">Closed</span></b><br>';
        }
    }
    //end

    var sales = 0, customer_visit = 0, expenses = 0 , revenue = 0;
    $.each(additionalInfo.analytics,function(i,v){
        sales +=v.sales;
        customer_visit +=v.customer_visit;
        expenses +=v.expenses;
        revenue += (v.sales - v.expenses);
    });

    sales = "Sales: " + sales + "<br>";
    customer_visit = "Customer visit: " + customer_visit + "<br>";
    expenses = "Expenses: " + expenses + "<br>";
    revenue = "revenue: " + revenue + "<br>";

    // show infoWindow with on hover event
    google.maps.event.addListener(marker, 'mouseover', function() {

        infoWindow.setContent(
            '<div><b>' + place.name + '</b><br>' +
            place.vicinity + '<br><br>' + opening +
            'Restaurant type : ' + place.types + '<br>' + specialty + rating +
            '<a href="#" id="get_waze_' + place.id + '" class="get_destination_route">Get directions to this restaurant</a> <br> <hr>'
            + report +
            sales + customer_visit + expenses +revenue
        );

        infoWindow.open(map, this);
    });

    // on click get direction
    $(document).off('click', '#get_waze_' + place.id).on('click', '#get_waze_' + place.id, function() {
        setWaze(place.geometry.location);
    });
}

/*
    Get a list of Restaurants
*/
function listAllRestaurants(this_marker,additionalInfo = null) {
    var customers = 0, sales = 0, expenses = 0;

    if(additionalInfo){

        $.each(additionalInfo.analytics, function(i, v) {
            customers += v.customer_visit;
            sales += v.sales;
            expenses += v.expenses;
        });
    }else{
        //for init circle only
        $.each(google_restaurants,function(i,v){
            if (v.result.id == this_marker.id) {
                $.each(v.additionalInfo.analytics, function(i,v){
                    customers += v.customer_visit;
                    sales += v.sales;
                    expenses += v.expenses;
                });
            }
        });
    }

    total_customers_visit += customers;
    total_expenses += expenses;
    total_sales += sales;

    customers = customers > 0 ? formatNumbers(customers) : 'NA';
    sales = sales > 0 ? 'P' + formatNumbers(sales.toFixed(2)) : 'NA';

    document.getElementById('restaurants_list').innerHTML += '<input class="sub-body-cont" onclick="toggleMarker(\'' + this_marker.id + '\')" type="checkbox"  checked /> ' +
        this_marker.name + '<br>' +
        '<span style="margin-left:2em">- <strong>Customers:</strong> ' + customers +
        ', <strong>Sales:</strong> ' + sales +
        '</span>'+
        ', <strong>Expenses:</strong> ' + expenses +
        '</span><br>';
}

function formatNumbers(num) {
    num += '';
    var x = num.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

/*
    Toggle Marker
*/
function toggleMarker(id) {
    var mark = markersArray[id];

    if (!mark.getVisible()) {
        mark.setVisible(true);
    } else {
        mark.setVisible(false);
    }
}

/*
    Set routes/directions
*/
function setWaze(destination) {
    var request = {
        destination: destination,
        origin: myCurrentLocation,
        travelMode: defaultTravelMode
    };

    // init directions Service - library
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status == 'OK') {
            waze = $('#waze');
            waze.html(''); // reset routes details

            var routes = response.routes[0].legs[0].steps;
            // console.log(routes)
            if (routes) {
                for (var i = 1; i <= routes.length; i++) {
                    document.getElementById('waze').innerHTML += '<div class="sub-body-cont"><b>(' + i + ')</b><br>' + routes[i - 1].instructions + '</div><br>';
                }
            } else {
                waze.html('No direction found.');
            }

            routesDisplay.setDirections(response);
        }
    });
}

/*
    Add marker to stored restaurants from google
*/
function loopRestaurants() {
    var type = $("#types").val();
    total_restaurants = 0;

    if(type=="restaurant"){
        // console.log("loopRestaurants")
        $.each(google_restaurants, function(i, v) {
            createMarker(v.result,v.additionalInfo);
            total_restaurants++;
        });
        total_restaurants = google_restaurants.length;
    }

}

/*
    Reset All markers
*/
function clearMarker() {

    $.each(markersArray, function(i, marker) {
        // console.log(marker.map)
        marker.setMap(null);
        // console.log(marker.map)
    });
    markersArray = {};
}

/*
    Reset all current values to default values
*/
function resetAllSetValuesToDefault() {
    $('#total_restaurants').html('');
    $('#total_sales').html('');
    $('#total_customer_visit').html('');
    $('#waze').html('Please select your destination.');

    clearMarker(); // clear markers

    infoWindow.close(); // close info window

    // reset directions renderer
    routesDisplay.setMap(null);
    routesDisplay = new google.maps.DirectionsRenderer({
        map: map
    });

    $('#report').hide(); // hide report container
}

/*
    Check the places stored in google_restaurants then add marker
*/
function getPlaces() {
    var type = document.getElementById("types").value;
    // Allow user to select restaurant type
    // if current value is not exist in array use :name to search the area

    total_restaurants = 0;
    total_sales = 0;
    total_customers_visit = 0;
    $.each(google_restaurants, function(i, v) {
        if(type=="restaurant"){
            createMarker(v.result,v.additionalInfo);
            total_restaurants++;
        }else{
            if (type == v.additionalInfo.types) { // filter restaurants based on type
                console.log(type)
                createMarker(v.result,v.additionalInfo);
                total_restaurants++;
            }
        }
    });

    // check if circle exists; if true, count summary within the radius
    if (circle) {
        var circle_pos = new google.maps.LatLng(circle.getCenter().lat(), circle.getCenter().lng());
        total_restaurants = 0, total_customers_visit = 0, total_sales=0; // reset counters
        document.getElementById('restaurants_list').innerHTML = ''; // clear restaurants list
        $.each(markersArray, function(i, v) {
            if (google.maps.geometry.spherical.computeDistanceBetween(v.getPosition(), circle_pos) < circle.getRadius()) {
                listAllRestaurants(v); // restaurants_list
                total_restaurants++;
            }
        });

    }

    renderTotals();
}

/*
    add value to specific element
*/
function renderTotals() {
    $('#total_restaurants').html(total_restaurants);
    $('#total_sales').html('P' + formatNumbers(total_sales));
    $('#total_customer_visit').html(formatNumbers(total_customers_visit));
}

/*
    Initialize Drawing Manager
*/
function initCircle() {
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['circle']
        },
        markerOptions: { icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png' },
        circleOptions: {
            clickable: false,
            editable: true,
            fillColor: '#FF0000',
            fillOpacity: 0.1,
            strokeColor: '#FF0000',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            zIndex: 1
        }
    });
    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'circlecomplete', function(circ) {
        resetCircle();
        circle = circ;

        clearMarker();
        loopRestaurants();
        getPlaces();

        // radius changed event
        google.maps.event.addListener(circle, 'radius_changed', function() {
            clearMarker();
            loopRestaurants();
            getPlaces();
        });

        // circle moved event
        google.maps.event.addListener(circle, 'center_changed', function() {
            clearMarker();
            loopRestaurants();
            getPlaces();
        });
    });
}

/*
    Reset Circle values
*/
function resetCircle() {
    if (circle) {
        circle.setMap(null);
    }
}

$('#types').on('change', function() {
    document.getElementById('restaurants_list').innerHTML = ''; // clear restaurants list
    //load map instead of sending another request
    resetAllSetValuesToDefault();
    // loopRestaurants();
    getPlaces();
});