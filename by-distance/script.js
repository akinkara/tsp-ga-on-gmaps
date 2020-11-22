var map;
var directionsDisplay = null;
var directionsService;
var polylinePath;

var nodes = [];
var prevNodes = [];
var markers = [];
var durations = [];

// Initialize google maps
function initializeMap() {
    // Map options
    var opts = {
        center: new google.maps.LatLng(37.874354, 32.493380),
        zoom: 14,
        streetViewControl: false,
        mapTypeControl: false,
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), opts);

    var marker = new google.maps.Marker({position: {lat: 37.874354, lng: 32.493380}, map: map});
    markers.push(marker);
    nodes.push({lat: 37.874354, lng: 32.493380});
    var marker = new google.maps.Marker({position: {lat: 37.875514, lng: 32.500922}, map: map});
    markers.push(marker);
    nodes.push({lat: 37.875514, lng: 32.500922});
    var marker = new google.maps.Marker({position: {lat: 37.869806, lng: 32.490161}, map: map});
    markers.push(marker);
    nodes.push({lat: 37.869806, lng: 32.490161});
    var marker = new google.maps.Marker({position: {lat: 37.872025, lng: 32.486256}, map: map});
    markers.push(marker);
    nodes.push({lat: 37.872025, lng: 32.486256});
    markers.push(marker);
    var marker = new google.maps.Marker({position: {lat: 37.864750, lng: 32.501148}, map: map});
    markers.push(marker);
    nodes.push({lat: 37.864750, lng: 32.501148});
    markers.push(marker);
    var marker = new google.maps.Marker({position: {lat: 37.874223, lng: 32.497447}, map: map});
    markers.push(marker);
    nodes.push({lat: 37.874223, lng: 32.497447});
    markers.push(marker);
    
    // Create map click event
    google.maps.event.addListener(map, 'click', function(event) {
        // Add destination (max 9)
        if (nodes.length >= 9) {
            alert('Max destinations added');
            return;
        }

        // If there are directions being shown, clear them
        clearDirections();
        
        // Add a node to map
        marker = new google.maps.Marker({position: event.latLng, map: map});
        markers.push(marker);
        
        // Store node's lat and lng
        nodes.push(event.latLng);
        
        // Update destination count
        //$('#destinations-count').html(nodes.length);
    });
    

    //Add "my location" button
    var myLocationDiv = document.createElement('div');
    new getMyLocation(myLocationDiv, map);

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(myLocationDiv);
    
     function getMyLocation(myLocationDiv, map) { 
         var myLocationBtn = document.createElement('button'); 
         myLocationBtn.innerHTML = ''; 
         myLocationBtn.className = 'large-btn'; 
         myLocationBtn.style.margin = '5px'; 
         myLocationBtn.style.opacity = '0.95'; 
         myLocationBtn.style.borderRadius = '3px'; 
         myLocationDiv.appendChild(myLocationBtn); 
    
         google.maps.event.addDomListener(myLocationBtn, 'click', function() { 
             navigator.geolocation.getCurrentPosition(function(success) { 
                 map.setCenter(new google.maps.LatLng(success.coords.latitude, success.coords.longitude)); 
                 map.setZoom(12); 
             }); 
         }); 
     } 
}

// Get all durations depending on travel type
function getDurations(callback) {
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: nodes,
        destinations: nodes,
         travelMode: google.maps.TravelMode["DRIVING"],
         
         unitSystem: google.maps.UnitSystem.metric,  //kilometers and meters
        //travelMode: google.maps.TravelMode[$('#travel-type').val()],
        //avoidHighways: parseInt($('#avoid-highways').val()) > 0 ? true : false,
        avoidHighways: true,
        avoidTolls: false,
    }, function(distanceData) {
        // Create duration data array
        var nodeDistanceData;
        for (originNodeIndex in distanceData.rows) {
            nodeDistanceData = distanceData.rows[originNodeIndex].elements;
            durations[originNodeIndex] = [];
            for (destinationNodeIndex in nodeDistanceData) {
                if (durations[originNodeIndex][destinationNodeIndex] = nodeDistanceData[destinationNodeIndex].distance == undefined) {
                    alert('Error: couldn\'t get a trip duration from API');
                    return;
                }
                durations[originNodeIndex][destinationNodeIndex] = nodeDistanceData[destinationNodeIndex].distance.value;
            }
        }

        if (callback != undefined) {
            callback();
        }
    });
}

// Removes markers and temporary paths
function clearMapMarkers() {
    for (index in markers) {
        markers[index].setMap(null);
    }

    prevNodes = nodes;
    nodes = [];

    if (polylinePath != undefined) {
        polylinePath.setMap(null);
    }
    
    markers = [];
    
    $('#ga-buttons').show();
}
// Removes map directions
function clearDirections() {
    // If there are directions being shown, clear them
    if (directionsDisplay != null) {
        directionsDisplay.setMap(null);
        directionsDisplay = null;
    }
}
// Completely clears map
function clearMap() {
    clearMapMarkers();
    clearDirections();
    
    //$('#destinations-count').html('0');
}

// Initial Google Maps
google.maps.event.addDomListener(window, 'load', initializeMap);

// Create listeners
$(document).ready(function() {
    $('#clear-map').click(clearMap);

    
    $('#find-route').click(function() {    
        if (nodes.length < 2) {
            if (prevNodes.length >= 2) {
                nodes = prevNodes;
            } else {
                alert('Click on the map to select destination points');
                return;
            }
        }

        if (directionsDisplay != null) {
            directionsDisplay.setMap(null);
            directionsDisplay = null;
        }
        
        $('#ga-buttons').hide();

        
        getDurations(function(){
            $('.ga-info').show();

            
            ga.getConfig();
            var pop = new ga.population();
            pop.initialize(nodes.length);
            var route = pop.getFittest().chromosome;

            ga.evolvePopulation(pop, function(update) {
                $('#generations-passed').html(update.generation);
                $('#best-time').html((update.population.getFittest().getDistance()).toFixed(2) + '  metre');
            
                
                var route = update.population.getFittest().chromosome;
                var routeCoordinates = [];
                for (index in route) {
                    routeCoordinates[index] = nodes[route[index]];
                }
                routeCoordinates[route.length] = nodes[route[0]];

                // çizgileri çizen kod kısımı
                // if (polylinePath != undefined) {
                //     polylinePath.setMap(null);
                // }
                // polylinePath = new google.maps.Polyline({
                //     path: routeCoordinates,
                //     strokeColor: "#ff0000",
                //     strokeOpacity: 0.75,
                //     strokeWeight: 2,
                // });
                // polylinePath.setMap(map);
            }, function(result) {
                
                route = result.population.getFittest().chromosome;

                
                directionsService = new google.maps.DirectionsService();
                directionsDisplay = new google.maps.DirectionsRenderer();
                directionsDisplay.setMap(map);
                var waypts = [];
                for (var i = 1; i < route.length; i++) {
                    waypts.push({
                        location: nodes[route[i]],
                        stopover: true
                    });
                }
                
                
                var request = {
                    origin: nodes[route[0]],
                    destination: nodes[route[0]],
                    waypoints: waypts,
                    travelMode: google.maps.TravelMode["DRIVING"],
                   //  travelMode: google.maps.TravelMode[$('#travel-type').val()],
                   // avoidHighways: parseInt($('#avoid-highways').val()) > 0 ? true : false,
                    avoidHighways: true,
                    avoidTolls: false
                };
                directionsService.route(request, function(response, status) {

                     
                        if (status === 'OK') {
                          directionsDisplay.setDirections(response);
                          var route = response.routes[0];
                          var summaryPanel = document.getElementById('directions-panel');
                          summaryPanel.innerHTML = '';
                          // For each route, display summary information.
                          for (var i = 0; i < route.legs.length; i++) {
                            var routeSegment = i + 1;
                            summaryPanel.innerHTML += '<b>Rota: ' + routeSegment +
                                '</b><br>';
                            summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
                            summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
                            summaryPanel.innerHTML += 'Mesafe: '+ route.legs[i].distance.text+' <br><br>';
                          }
                        } else {
                          window.alert('Directions request failed due to ' + status);
                        }
                      

                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                    }
                    clearMapMarkers();
                });
            });
        });
    });
});


var ga = {
    
    "crossoverRate": 0.5,
    "mutationRate": 0.1,
    
    "populationSize": 50,
    "tournamentSize": 5,
    "elitism": true,
    "maxGenerations": 50,
    
    "tickerSpeed": 60,

    //Loads config from HTML inputs
    "getConfig": function() {
        ga.crossoverRate = parseFloat($('#crossover-rate').val());
        ga.mutationRate = parseFloat($('#mutation-rate').val());
        ga.populationSize = parseInt($('#population-size').val()) || 50;
        ga.elitism = parseInt($('#elitism').val()) || false;
        ga.maxGenerations = parseInt($('#maxGenerations').val()) || 50;
    },
    
    "evolvePopulation": function(population, generationCallBack, completeCallBack) {        
        
        var generation = 1;
        var evolveInterval = setInterval(function() {
            if (generationCallBack != undefined) {
                generationCallBack({
                    population: population,
                    generation: generation,
                });
            }

           
            population = population.crossover();
            population.mutate();
            generation++;
            
            
            if (generation > ga.maxGenerations) {
                
                clearInterval(evolveInterval);
                
                if (completeCallBack != undefined) {
                    completeCallBack({
                        population: population,
                        generation: generation,
                    });
                }
            }
        }, ga.tickerSpeed);
    },

    "population": function() {
        this.individuals = [];
    
        this.initialize = function(chromosomeLength) {
            this.individuals = [];
    
            for (var i = 0; i < ga.populationSize; i++) {
                var newIndividual = new ga.individual(chromosomeLength);
                newIndividual.initialize();
                this.individuals.push(newIndividual);
            }
        };
        
       
        this.mutate = function() {
            var fittestIndex = this.getFittestIndex();

            for (index in this.individuals) {
                if (ga.elitism != true || index != fittestIndex) {
                    this.individuals[index].mutate();
                }
            }
        };

        // Applies crossover to current population and returns population of offspring
        this.crossover = function() {
            // Create offspring population
            var newPopulation = new ga.population();
            
            // Find fittest individual
            var fittestIndex = this.getFittestIndex();

            for (index in this.individuals) {
                // Add unchanged into next generation if this is the elite individual and elitism is enabled
                if (ga.elitism == true && index == fittestIndex) {
                    // Replicate individual
                    var eliteIndividual = new ga.individual(this.individuals[index].chromosomeLength);
                    eliteIndividual.setChromosome(this.individuals[index].chromosome.slice());
                    newPopulation.addIndividual(eliteIndividual);
                } else {
                    // Select mate
                    var parent = this.tournamentSelection();
                    // Apply crossover
                    this.individuals[index].crossover(parent, newPopulation);
                }
            }
            
            return newPopulation;
        };

        // Adds an individual to current population
        this.addIndividual = function(individual) {
            this.individuals.push(individual);
        };

        // Selects an individual with tournament selection
        this.tournamentSelection = function() {
            // Randomly order population
            for (var i = 0; i < this.individuals.length; i++) {
                var randomIndex = Math.floor(Math.random() * this.individuals.length);
                var tempIndividual = this.individuals[randomIndex];
                this.individuals[randomIndex] = this.individuals[i];
                this.individuals[i] = tempIndividual;
            }

            // Create tournament population and add individuals
            var tournamentPopulation = new ga.population();
            for (var i = 0; i < ga.tournamentSize; i++) {
                tournamentPopulation.addIndividual(this.individuals[i]);
            }

            return tournamentPopulation.getFittest();
        };
        
        this.getFittestIndex = function() {
            var fittestIndex = 0;

            // Loop over population looking for fittest
            for (var i = 1; i < this.individuals.length; i++) {
                if (this.individuals[i].calcFitness() > this.individuals[fittestIndex].calcFitness()) {
                    fittestIndex = i;
                }
            }

            return fittestIndex;
        };

        // Return fittest individual
        this.getFittest = function() {
            return this.individuals[this.getFittestIndex()];
        };
    },

    // Individual class
    "individual": function(chromosomeLength) {
        this.chromosomeLength = chromosomeLength;
        this.fitness = null;
        this.chromosome = [];

        // Initialize random individual
        this.initialize = function() {
            this.chromosome = [];

            // Generate random chromosome
            for (var i = 0; i < this.chromosomeLength; i++) {
                this.chromosome.push(i);
            }
            for (var i = 0; i < this.chromosomeLength; i++) {
                var randomIndex = Math.floor(Math.random() * this.chromosomeLength);
                var tempNode = this.chromosome[randomIndex];
                this.chromosome[randomIndex] = this.chromosome[i];
                this.chromosome[i] = tempNode;
            }
        };
        
        // Set individual's chromosome
        this.setChromosome = function(chromosome) {
            this.chromosome = chromosome;
        };
        
        // Mutate individual
        this.mutate = function() {
            this.fitness = null;
            
            // Loop over chromosome making random changes
            for (index in this.chromosome) {
                if (ga.mutationRate > Math.random()) {
                    var randomIndex = Math.floor(Math.random() * this.chromosomeLength);
                    var tempNode = this.chromosome[randomIndex];
                    this.chromosome[randomIndex] = this.chromosome[index];
                    this.chromosome[index] = tempNode;
                }
            }
        };
        
        // Returns individuals route distance
        this.getDistance = function() {
            var totalDistance = 0;

            for (index in this.chromosome) {
                var startNode = this.chromosome[index];
                var endNode = this.chromosome[0];
                if ((parseInt(index) + 1) < this.chromosome.length) {
                    endNode = this.chromosome[(parseInt(index) + 1)];
                }

                totalDistance += durations[startNode][endNode];
            }
            
            totalDistance += durations[startNode][endNode];
            
            return totalDistance;
        };

        // Calculates individuals fitness value
        this.calcFitness = function() {
            if (this.fitness != null) {
                return this.fitness;
            }
        
            var totalDistance = this.getDistance();

            this.fitness = 1 / totalDistance;
            return this.fitness;
        };

        // Applies crossover to current individual and mate, then adds it's offspring to given population
        this.crossover = function(individual, offspringPopulation) {
            var offspringChromosome = [];

            // Add a random amount of this individual's genetic information to offspring
            var startPos = Math.floor(this.chromosome.length * Math.random());
            var endPos = Math.floor(this.chromosome.length * Math.random());

            var i = startPos;
            while (i != endPos) {
                offspringChromosome[i] = individual.chromosome[i];
                i++

                if (i >= this.chromosome.length) {
                    i = 0;
                }
            }

            // Add any remaining genetic information from individual's mate
            for (parentIndex in individual.chromosome) {
                var node = individual.chromosome[parentIndex];

                var nodeFound = false;
                for (offspringIndex in offspringChromosome) {
                    if (offspringChromosome[offspringIndex] == node) {
                        nodeFound = true;
                        break;
                    }
                }

                if (nodeFound == false) {
                    for (var offspringIndex = 0; offspringIndex < individual.chromosome.length; offspringIndex++) {
                        if (offspringChromosome[offspringIndex] == undefined) {
                            offspringChromosome[offspringIndex] = node;
                            break;
                        }
                    }
                }
            }

            // Add chromosome to offspring and add offspring to population
            var offspring = new ga.individual(this.chromosomeLength);
            offspring.setChromosome(offspringChromosome);
            offspringPopulation.addIndividual(offspring);
        };
    },
};