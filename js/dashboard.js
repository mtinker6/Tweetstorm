var window_width = $(window).width();
var width01 = 640, height01 = 400, width02 = 370, height02 = 600, 
    width03 = 260, height03 = 600, width04 = 640, height04 = 200, centered, geojson, topo, counts, g2, g3, g4, k = 1;

if(window_width < 640){
  width04 = window_width *0.95;
  width01 = window_width *0.9;
  width02 = window_width *0.9 * 1 / 2;
}

var svg01 = d3.select(".dashboard1").append("svg").attr("width", width01).attr("height", height01);
var svg02 = d3.select(".dashboard2").append("svg").attr("width", width02).attr("height", height02);
var svg03 = d3.select(".dashboard3").append("svg").attr("width", width03).attr("height", height03);
var svg04 = d3.select(".dashboard4").append("svg").attr("width", width04).attr("height", height04);

// Default event and state index
var layers = ["Candidate Preference", "Polarity", "Subjectivity"];
var debates = ["1st Debate", "VP Debate", "2nd Debate", "3rd Debate", "Election Day"];
var debate = 0, colour_scheme = 0, state_index;

// Add background for click zoom out functionality, visualize borders
svg01.append('rect').attr('class', 'background').attr('width', width01).attr('height', height01).on('click', clicked);
// svg02.append('rect').attr('class', 'background').attr('width', width02).attr('height', height02);
// svg03.append('rect').attr('class', 'background').attr('width', width03).attr('height', height03);
// svg04.append('rect').attr('class', 'background').attr('width', width04).attr('height', height04);
// State name on hover
svg02.append('text').attr('class','statehover').attr('x',10).attr('y',50).attr("fill", "#46b5d1");
svg02.append('text').attr('class','statedetails preferreddetails').attr('x',10).attr('y',90).attr("fill", "white").style("font-weight",'bold');
svg02.append('text').attr('class','statedetails actualdetails').attr('x',180).attr('y',90).attr("fill", "white").style("font-weight",'bold');
svg02.append('svg:image').attr('class','statedetails statepreferred').attr('x',45).attr('y',105).attr('width',75).attr('height',75);
svg02.append('svg:image').attr('class','statedetails elected').attr('x',168).attr('y',105).attr('width',75).attr('height',75);
svg02.append('text').attr('class','statedetails statepolarity').attr("fill", "white").style("font-weight",'bold').style('font-size','22px').attr('x',10).attr('y',220);
svg02.append('text').attr('class','statedetails statesubjectivity').attr("fill", "white").style("font-weight",'bold').style('font-size','22px').attr('x',10).attr('y',250);
svg02.append('text').attr('class','statedetails top-themes').attr("fill", "white").style("font-weight",'bold').style('font-size','22px').attr('x',10).attr('y',300);
svg02.append('text').attr('class','statedetails theme1').attr('x',10).attr('y',328).attr("fill", "white").style('font-size','18px');
svg02.append('text').attr('class','statedetails theme2').attr('x',10).attr('y',351).attr("fill", "white").style('font-size','18px');
svg02.append('text').attr('class','statedetails theme3').attr('x',10).attr('y',374).attr("fill", "white").style('font-size','18px');
// Titles
svg03.append('text').attr('x',33).attr('y',40).attr('fill','white').style("font-weight",'bold').text('Subjectivity');
svg03.append('text').attr('x',166).attr('y',40).attr('fill','white').style("font-weight",'bold').text('Polarity');
svg04.append('text').attr('x',53).attr('y',20).attr('fill','white').style("font-weight",'bold').text('Candidate');
svg04.append('text').attr('x',29).attr('y',40).attr('fill','white').style("font-weight",'bold').text('Preference Score');
svg04.append('text').attr('x',5).attr('y',140).attr('fill','white').style("font-weight",'bold').style('font-size','24px').text('Select map layer:').attr('class', 'Selectmaplayer');

// Legends, scales, axes
var thickness = 20; var legendlength = 400;
var colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([0.24, 0.38]); // For state subjectivity [0.24, 0.38]
var colorScale2 = d3.scaleSequential(d3.interpolateYlGn).domain([0, 0.14]); // For state polarity [0, 0.14]
var candidateScale = d3.scaleSequentialSqrt(d3.interpolateRdBu).domain([0.9, -0.9]); // Non-linear values
var axisScale = d3.scaleLinear().domain(colorScale.domain()).range([0, legendlength]);
var axisScale2 = d3.scaleLinear().domain(colorScale2.domain()).range([0, legendlength]);
var candidateAxis = d3.scaleSqrt().domain(candidateScale.domain()).range([0, legendlength]);
svg03.append("defs").append("linearGradient").attr("id", "linear-gradient")
      .selectAll("stop").data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
      .enter().append("stop").attr("offset", d => d.offset).attr("stop-color", d => d.color);
svg03.append("defs").append("linearGradient").attr("id", "linear-gradient2")
      .selectAll("stop").data(colorScale2.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale2(t) })))
      .enter().append("stop").attr("offset", d => d.offset).attr("stop-color", d => d.color);
svg04.append("defs").append("linearGradient").attr("id", "linear-gradient3")
      .selectAll("stop").data(candidateScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: candidateScale(t) })))
      .enter().append("stop").attr("offset", d => d.offset).attr("stop-color", d => d.color);
svg03.append('g')
    .attr("transform", 'translate(0,280)')
    .append("rect").attr("width", legendlength).attr("height", thickness)
    .style("fill", "url(#linear-gradient)")
    .attr('transform', 'rotate(270 130 70)');
svg03.append('g')
    .attr("transform", 'translate(120,280)')
    .append("rect").attr("width", legendlength).attr("height", thickness)
    .style("fill", "url(#linear-gradient2)")
    .attr('transform', 'rotate(270 130 70)');
svg04.append('g')
    .attr("transform", 'translate(10,50)')
    .append("rect").attr("width", legendlength*1.1).attr("height", thickness-5)
    .style("fill", "url(#linear-gradient3)");

var path01 = d3.geoPath().projection(d3.geoAlbersUsa().translate([width01/2, height01/2]).scale([window_width < 640 ? window_width : 700]));

var g = svg01.append('g');
var mapLayer = g.append('g').classed('map-layer', true);
var slideLayer = svg04.append('g').attr('id', 'sliderToggle');
var buttonsLayer = svg04.append('g');

// Load data
var promises = [d3.json("data/states-10m.json"), d3.csv("data/tweet_map.csv")];
Promise.all(promises).then(draw_map);

// Event selectors
var tickFormatter = function(d) {return "";};
var sliderStep = d3.sliderBottom().min(1).max(5).width(300).tickFormat(tickFormatter).ticks(1).step(1).default(1)
                    .on('onchange', val => {
                      debate = val - 1;
                      update_map();
                    });
// buttonsLayer.selectAll('text').data(layers).enter().append('text')
//           .attr('x', 250)
//           .attr('y', function(d,i) {return 140 + i*26})
//           .text(function(d) {return d;})
//           .style('font-size','18px')
//           .style('fill', function(d,i) {return i==0 ? 'cyan' : 'white';})
//           .on('click', click_button)
//           .on('mouseover', function() {d3.select(this).style('cursor', 'pointer');});
var layer1 = 440;
var layer2 = 530;
var layer0 = 220;
if(window_width < 1000){
  var widthPortion = window_width / 4;
  layer0 = widthPortion
  layer1 = widthPortion * 2 + 25;
  layer2 = widthPortion * 3 - 40;
}
buttonsLayer.append('text')
          .attr('x', layer0)
          .attr('y', 140)
          .text(layers[0])
          .attr('class', 'layeroption')
          .style('font-size','20px')
          .style('fill', 'cyan')
          .on('click', click_button)
          .on('mouseover', function() {d3.select(this).style('cursor', 'pointer');});
buttonsLayer.append('text')
          .attr('x', layer1)
          .attr('y', 140)
          .text(layers[1])
          .attr('class', 'layeroption')
          .style('font-size','20px')
          .style('fill', 'white')
          .on('click', click_button2)
          .on('mouseover', function() {d3.select(this).style('cursor', 'pointer');});
buttonsLayer.append('text')
          .attr('x', layer2)
          .attr('y', 140)
          .text(layers[2])
          .attr('class', 'layeroption')
          .style('font-size','20px')
          .style('fill', 'white')
          .on('click', click_button3)
          .on('mouseover', function() {d3.select(this).style('cursor', 'pointer');});
// slideLayer.call(sliderStep)
//           .attr('transform', 'translate(290,100)')
//           .style("fill", "white")
//           .append('text').text('Selected Event:')
//           .style('font-size','24px')
//           .style("font-weight", "bold")
//           .style("fill", "white")
//           .attr('transform', 'translate(-10,50)')
// slideLayer.append('text').text(debates[debate]) // Display selected event
//           .attr('class', 'selected_event')
//           .attr('font-size','24px')
//           .attr("font-weight", "bold")
//           .style("fill", "cyan")
//           .attr('transform', 'translate(180,50)');

function draw_map(array) {
    geojson = topojson.feature(array[0], array[0].objects.states);
    topo = array[0];
    counts = array[1];
    for (var b = 0; b < counts.length; b++) {
        counts[b] = {
            State: counts[b].state,
            Elected: counts[b].elected,
            Candidate1: counts[b].preferred_candidate1,
            Candidate_score1: parseFloat(counts[b].net_candidate_score1),
            Polarity1: parseFloat(counts[b].polarity1),
            Subjectivity1: parseFloat(counts[b].subjectivity1),
            theme_1_1: counts[b].top_theme_1_1,
            theme_2_1: counts[b].top_theme_2_1,
            theme_3_1: counts[b].top_theme_3_1,
            trump_score1: parseFloat(counts[b].trump_candidate1),
            trump_polarity1: parseFloat(counts[b].trump_polarity1),
            trump_subjectivity1: parseFloat(counts[b].trump_subjectivity1),
            hillary_score1: parseFloat(counts[b].hillary_candidate1),
            hillary_polarity1: parseFloat(counts[b].hillary_polarity1),
            hillary_subjectivity1: parseFloat(counts[b].hillary_subjectivity1),
            Candidate2: counts[b].preferred_candidate2,
            Candidate_score2: parseFloat(counts[b].net_candidate_score2),
            Polarity2: parseFloat(counts[b].polarity2),
            Subjectivity2: parseFloat(counts[b].subjectivity2),
            theme_1_2: counts[b].top_theme_1_2,
            theme_2_2: counts[b].top_theme_2_2,
            theme_3_2: counts[b].top_theme_3_2,
            trump_score2: parseFloat(counts[b].trump_candidate2),
            trump_polarity2: parseFloat(counts[b].trump_polarity2),
            trump_subjectivity2: parseFloat(counts[b].trump_subjectivity2),
            hillary_score2: parseFloat(counts[b].hillary_candidate2),
            hillary_polarity2: parseFloat(counts[b].hillary_polarity2),
            hillary_subjectivity2: parseFloat(counts[b].hillary_subjectivity2),
            Candidate3: counts[b].preferred_candidate3,
            Candidate_score3: parseFloat(counts[b].net_candidate_score3),
            Polarity3: parseFloat(counts[b].polarity3),
            Subjectivity3: parseFloat(counts[b].subjectivity3),
            theme_1_3: counts[b].top_theme_1_3,
            theme_2_3: counts[b].top_theme_2_3,
            theme_3_3: counts[b].top_theme_3_3,
            trump_score3: parseFloat(counts[b].trump_candidate3),
            trump_polarity3: parseFloat(counts[b].trump_polarity3),
            trump_subjectivity3: parseFloat(counts[b].trump_subjectivity3),
            hillary_score3: parseFloat(counts[b].hillary_candidate3),
            hillary_polarity3: parseFloat(counts[b].hillary_polarity3),
            hillary_subjectivity3: parseFloat(counts[b].hillary_subjectivity3),
            Candidate4: counts[b].preferred_candidate4,
            Candidate_score4: parseFloat(counts[b].net_candidate_score4),
            Polarity4: parseFloat(counts[b].polarity4),
            Subjectivity4: parseFloat(counts[b].subjectivity4),
            theme_1_4: counts[b].top_theme_1_4,
            theme_2_4: counts[b].top_theme_2_4,
            theme_3_4: counts[b].top_theme_3_4,
            trump_score4: parseFloat(counts[b].trump_candidate4),
            trump_polarity4: parseFloat(counts[b].trump_polarity4),
            trump_subjectivity4: parseFloat(counts[b].trump_subjectivity4),
            hillary_score4: parseFloat(counts[b].hillary_candidate4),
            hillary_polarity4: parseFloat(counts[b].hillary_polarity4),
            hillary_subjectivity4: parseFloat(counts[b].hillary_subjectivity4),
            Candidate5: counts[b].preferred_candidate5,
            Candidate_score5: parseFloat(counts[b].net_candidate_score5),
            Polarity5: parseFloat(counts[b].polarity5),
            Subjectivity5: parseFloat(counts[b].subjectivity5),
            theme_1_5: counts[b].top_theme_1_5,
            theme_2_5: counts[b].top_theme_2_5,
            theme_3_5: counts[b].top_theme_3_5,
            trump_score5: parseFloat(counts[b].trump_candidate5),
            trump_polarity5: parseFloat(counts[b].trump_polarity5),
            trump_subjectivity5: parseFloat(counts[b].trump_subjectivity5),
            hillary_score5: parseFloat(counts[b].hillary_candidate5),
            hillary_polarity5: parseFloat(counts[b].hillary_polarity5),
            hillary_subjectivity5: parseFloat(counts[b].hillary_subjectivity5)
        }
    };

    //Merge the data and GeoJSON
    for (var i = 0; i < counts.length; i++) {
        var dataState = counts[i].State;
        //Find the corresponding state inside the GeoJSON
        for (var j = 0; j < geojson.features.length; j++) {
            var jsonState = geojson.features[j].properties.name;
            if (dataState == jsonState) { //Copy the data value into the JSON
                geojson.features[j].properties.elected = counts[i].Elected;
                geojson.features[j].properties.polarity = [counts[i].Polarity1, counts[i].Polarity2, counts[i].Polarity3, counts[i].Polarity4, counts[i].Polarity5];
                geojson.features[j].properties.subjectivity = [counts[i].Subjectivity1, counts[i].Subjectivity2, counts[i].Subjectivity3, counts[i].Subjectivity4, counts[i].Subjectivity5];
                geojson.features[j].properties.candidate = [counts[i].Candidate1, counts[i].Candidate2, counts[i].Candidate3, counts[i].Candidate4, counts[i].Candidate5];
                geojson.features[j].properties.candidate_score = [counts[i].Candidate_score1, counts[i].Candidate_score2, counts[i].Candidate_score3, counts[i].Candidate_score4, counts[i].Candidate_score5]
                geojson.features[j].properties.theme1 = [counts[i].theme_1_1, counts[i].theme_1_2, counts[i].theme_1_3, counts[i].theme_1_4, counts[i].theme_1_5];
                geojson.features[j].properties.theme2 = [counts[i].theme_2_1, counts[i].theme_2_2, counts[i].theme_2_3, counts[i].theme_2_4, counts[i].theme_2_5];
                geojson.features[j].properties.theme3 = [counts[i].theme_3_1, counts[i].theme_3_2, counts[i].theme_3_3, counts[i].theme_3_4, counts[i].theme_3_5];
                geojson.features[j].properties.trump_score = [counts[i].trump_score1, counts[i].trump_score2, counts[i].trump_score3, counts[i].trump_score4, counts[i].trump_score5];
                geojson.features[j].properties.trump_polarity = [counts[i].trump_polarity1, counts[i].trump_polarity2, counts[i].trump_polarity3, counts[i].trump_polarity4, counts[i].trump_polarity5];
                geojson.features[j].properties.trump_subjectivity = [counts[i].trump_subjectivity1, counts[i].trump_subjectivity2, counts[i].trump_subjectivity3, counts[i].trump_subjectivity4, counts[i].trump_subjectivity5];
                geojson.features[j].properties.hillary_score = [counts[i].hillary_score1, counts[i].hillary_score2, counts[i].hillary_score3, counts[i].hillary_score4, counts[i].hillary_score5];
                geojson.features[j].properties.hillary_polarity = [counts[i].hillary_polarity1, counts[i].hillary_polarity2, counts[i].hillary_polarity3, counts[i].hillary_polarity4, counts[i].hillary_polarity5];
                geojson.features[j].properties.hillary_subjectivity = [counts[i].hillary_subjectivity1, counts[i].hillary_subjectivity2, counts[i].hillary_subjectivity3, counts[i].hillary_subjectivity4, counts[i].hillary_subjectivity5];
                break;}
        }
    };
    // Remove non-states - delete [27, 44, 45, 46, 49, 50]
    geojson.features.splice(50,1); geojson.features.splice(49,1); geojson.features.splice(46,1); geojson.features.splice(45,1);
    geojson.features.splice(44,1); geojson.features.splice(27,1);

    //Draw states
    mapLayer.selectAll('path').data(geojson.features).enter().append('path')
            .attr('d', path01).attr('vector-effect', 'non-scaling-stroke')
            .style('fill', function(d) {return candidateScale(d.properties.candidate_score[debate]);})
            .style('stroke','black')
            .style('stroke-width',0.5)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', clicked);
    //Draw country-level plots
    g3 = svg03.append('g')
    g4 = svg03.append('g')

    g3.selectAll('.points').data(geojson.features).enter().append('circle').attr('class', 'points') // State polarity points
        .attr('cx', 165)
        .attr('cy', function(d) {return (477 - axisScale2(d.properties.polarity[debate]));})
        .attr('r',2)
        .style('stroke', 'white');
    g3.append("circle").attr('class', 'polarity_dot') // Moving polarity dot
        .attr('cx', 165)
        .attr('cy', 477)
        .attr('r',5);
        // .attr("transform", function(d) { return "translate(" + 165 + "," + 82 + ")"; }); upper bound coordinate
        // .attr("transform", function(d) { return "translate(" + 165 + "," + 477 + ")"; }); lower bound coordinate
    g3.append("rect").attr('class', 'polarity_rule') // Moving polarity rule
        .attr('x', 165)
        .attr('y', 476)
        .attr('width',84)
        .attr('height',3);
    g3.append('text').attr('class', 'polarity_score') // Moving polarity score
        .attr('x', 205)
        .attr('y', 476)
        .attr('fill', 'white')
        .text('');
    g3.append('text').attr('fill','white').attr('x',186).attr('y',501).text('0') // Min polarity
    g3.append('text').attr('fill','white').attr('x',172).attr('y',72).text('0.140') // Max polarity

    g4.selectAll('.points').data(geojson.features).enter().append('circle').attr('class', 'points') // State subjectivity points
        .attr('cx', 45)
        .attr('cy', function(d) {return (477 - axisScale(d.properties.subjectivity[debate])); })
        .attr('r',2)
        .style('stroke', 'white');
    g4.append("circle").attr('class', 'subjectivity_dot') // Moving subjectivity dot
        .attr('cx', 45)
        .attr('cy', 477)
        .attr('r',5);
        // .attr("transform", function(d) { return "translate(" + 45 + "," + 82 + ")"; }); upper bound coordinate
        // .attr("transform", function(d) { return "translate(" + 45 + "," + 477 + ")"; }); lower bound coordinate
    g4.append("rect").attr('class', 'subjectivity_rule') // Moving subjectivity rule
        .attr('x', 45)
        .attr('y', 476)
        .attr('width',84)
        .attr('height',3);
    g4.append('text').attr('class', 'subjectivity_score') // Moving subjectivity score
        .attr('x', 85)
        .attr('y', 476)
        .attr('fill', 'white')
        .text('');
    g4.append('text').attr('fill','white').attr('x',50).attr('y',501).text('0.240') // Min subjectivity
    g4.append('text').attr('fill','white').attr('x',50).attr('y',72).text('0.380') // Max subjectivity

    // Preferred candidate
    svg04.append("path")
        .attr("d", d3.symbol().type(d3.symbolTriangle).size(150))
        .style("fill", "red")
        .attr('class','preferred')
        .attr("transform", "translate(" + 386 + "," + 76 + ")");
    svg04.append('svg:image')
          .attr('x', 366)
          .attr('y',77)
          .attr('width',35)
          .attr('height',35)
          .attr('class', 'thumbnail')
          .attr("xlink:href", "./images/trump.png")
          .attr('opacity', 0);
    svg04.append('text')
          .attr('x',400)
          .attr('y',78)
          .attr('fill','white')
          .text('')
          .attr('class','candidate_score');
};

function update_map() {
    //Draw states\
    if (colour_scheme == 0) {
      mapLayer.selectAll('path').data(geojson.features)
        .style('fill', function(d) {return candidateScale(d.properties.candidate_score[debate]);})
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .on('click', clicked);
    } else if (colour_scheme == 1) {
      mapLayer.selectAll('path').data(geojson.features)
        .style('fill', function(d) {return colorScale2(d.properties.polarity[debate]);})
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .on('click', clicked);
    } else if (colour_scheme == 2) {
      mapLayer.selectAll('path').data(geojson.features)
        .style('fill', function(d) {return colorScale(d.properties.subjectivity[debate]);})
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .on('click', clicked);
    };
    // Colour selected state black if updated while zoomed in
    if (colour_scheme==0) {
      mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : candidateScale(d.properties.candidate_score[debate]);})
                                .style('cursor', function (d){return centered && d===centered ? 'zoom-out' : 'pointer'});
    } else if (colour_scheme==1) {
      mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : colorScale2(d.properties.polarity[debate]);})
                                .style('cursor', function (d){return centered && d===centered ? 'zoom-out' : 'pointer'});
    } else {
      mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : colorScale(d.properties.subjectivity[debate]);})
                                .style('cursor', function (d){return centered && d===centered ? 'zoom-out' : 'pointer'});
    };

    //Draw country-level plots
    g3.selectAll('.points').data(geojson.features)
        .transition()
        .duration(300)
        .attr('cx', 165)
        .attr('cy', function(d) {return (477 - axisScale2(d.properties.polarity[debate]));})
        .attr('r',2);
    g4.selectAll('.points').data(geojson.features)
        .transition()
        .duration(300)
        .attr('cx', 45)
        .attr('cy', function(d) {return (477 - axisScale(d.properties.subjectivity[debate]));})
        .attr('r',2);
    
    // Update selected event
    slideLayer.select('.selected_event').text(debates[debate]);

    // Update state details if zoomed in
    if (k>1) {
      d3.select('.statepreferred').attr("xlink:href", geojson.features[state_index].properties.candidate[debate]=='Donald Trump' ? './images/trump.png' : './images/clinton.png');
      d3.select('.elected').attr("xlink:href", geojson.features[state_index].properties.elected=='Donald Trump' ? './images/trump.png' : './images/clinton.png');
      d3.select('.statepolarity').text('Polarity: ' + geojson.features[state_index].properties.polarity[debate].toFixed(3));
      d3.select('.statesubjectivity').text('Subjectivity: ' + geojson.features[state_index].properties.subjectivity[debate].toFixed(3));
      d3.select('.theme1').text(geojson.features[state_index].properties.theme1[debate]);
      d3.select('.theme2').text(geojson.features[state_index].properties.theme2[debate]);
      d3.select('.theme3').text(geojson.features[state_index].properties.theme3[debate]);
    };
};

// Zoom function
function clicked(d, i) {
  // Compute centroid of the selected path
  if (d && centered !== d) {
    var centroid = path01.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 3.5;
    centered = d;
    // Change selected state name and details
    d3.select('.statehover').text(d.properties.name);
    d3.selectAll('.statedetails').attr('opacity',1);
    d3.select('.preferreddetails').text('Preferred Candidate');
    d3.select('.actualdetails').text('Elected');
    d3.select('.statepreferred').attr("xlink:href", d.properties.candidate[debate]=='Donald Trump' ? './images/trump.png' : './images/clinton.png');
    d3.select('.elected').attr("xlink:href", d.properties.elected=='Donald Trump' ? './images/trump.png' : './images/clinton.png');
    d3.select('.statepolarity').text('Polarity:    ' + d.properties.polarity[debate].toFixed(3));
    d3.select('.statesubjectivity').text('Subjectivity:    ' + d.properties.subjectivity[debate].toFixed(3));
    d3.select('.top-themes').text('Top Themes');
    d3.select('.theme1').text(d.properties.theme1[debate]);
    d3.select('.theme2').text(d.properties.theme2[debate]);
    d3.select('.theme3').text(d.properties.theme3[debate]);
  } else {
    x = width01 / 2;
    y = height01 / 2;
    k = 1;
    centered = null;
    d3.selectAll('.statedetails').attr('opacity',0);
  };
  // Highlight the clicked province
  if (colour_scheme==0) {
    mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : candidateScale(d.properties.candidate_score[debate]);})
                              .style('cursor', function (d){return centered && d===centered ? 'zoom-out' : 'pointer'});
  } else if (colour_scheme==1) {
    mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : colorScale2(d.properties.polarity[debate]);})
                              .style('cursor', function (d){return centered && d===centered ? 'zoom-out' : 'pointer'});
  } else {
    mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : colorScale(d.properties.subjectivity[debate]);})
                              .style('cursor', function (d){return centered && d===centered ? 'zoom-out' : 'pointer'});
  };
  // Zoom
  g.transition()
    .duration(500)
    .attr('transform', 'translate(' + width01 / 2 + ',' + height01 / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
  // Store selected state array index
  state_index = i;
};

function mouseover(d){
  // Highlight hovered province and show state name
  if (colour_scheme==0) {
    d3.select(this).style("fill", "lime");
  } else if (colour_scheme==1) {
    d3.select(this).style("fill", "red");
  } else {
    d3.select(this).style("fill", "aqua");
  };
  // Polarity plot animation
  d3.select(".polarity_dot").classed('opaque', true)
      .transition()
      .duration(300)
      .attr('cy', (477 - axisScale2(d.properties.polarity[debate])));
  d3.select(".polarity_rule").classed('opaque', true)
      .transition()
      .duration(300)
      .attr('y', (476 - axisScale2(d.properties.polarity[debate])));
  d3.select('.polarity_score').transition().duration(300)
      .attr('y', (470 - axisScale2(d.properties.polarity[debate])))
      .text(d.properties.polarity[debate].toFixed(3));
  // Subjectivity plot animation
  d3.select(".subjectivity_dot").classed('opaque', true)
      .transition()
      .duration(300)
      .attr('cy', (477 - axisScale(d.properties.subjectivity[debate])));
  d3.select(".subjectivity_rule").classed('opaque', true)
      .transition()
      .duration(300)
      .attr('y', (476 - axisScale(d.properties.subjectivity[debate])));
  d3.select('.subjectivity_score').transition().duration(300)
      .attr('y', (470 - axisScale(d.properties.subjectivity[debate])))
      .text(d.properties.subjectivity[debate].toFixed(3));

  if (k==1) {
    d3.select('.statehover').text(d.properties.name);
  };
  
  // Preferred candidate animation
  d3.select('.preferred').transition().duration(300).attr("transform", "translate(" + (190 + candidateAxis(d.properties.candidate_score[debate])) + "," + 76 + ")");
  d3.select('.thumbnail').classed('opaque', true).transition().duration(300).attr('x', (172 + candidateAxis(d.properties.candidate_score[debate]))).attr("xlink:href", d.properties.candidate_score[debate]>=0 ? './images/trump.png' : './images/clinton.png');
  d3.select('.candidate_score').transition().duration(300).text(Math.abs(d.properties.candidate_score[debate].toFixed(3))).attr('x', (215 + candidateAxis(d.properties.candidate_score[debate])));
  // Set cursor
  if (k == 1) {
    d3.select(this).style('cursor', 'zoom-in');
  };
};

function mouseout(d){
  // Reset province color and remove state name
  if (colour_scheme == 0) {
    mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : candidateScale(d.properties.candidate_score[debate]);});
  } else if (colour_scheme == 1) {
    mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : colorScale2(d.properties.polarity[debate]);});
  } else {
    mapLayer.selectAll('path').style('fill', function(d){return centered && d===centered ? 'black' : colorScale(d.properties.subjectivity[debate]);});
  };
};

function click_button() {
  colour_scheme = 0;
  update_map();
  buttonsLayer.selectAll('text').style("fill", "white");
  d3.select(this).style("fill", "cyan");
}
function click_button2() {
  colour_scheme = 1;
  update_map();
  buttonsLayer.selectAll('text').style("fill", "white");
  d3.select(this).style("fill", "cyan");
}
function click_button3() {
  colour_scheme = 2;
  update_map();
  buttonsLayer.selectAll('text').style("fill", "white");
  d3.select(this).style("fill", "cyan");
}

$('#sliderToggle').find('.slider').hide();