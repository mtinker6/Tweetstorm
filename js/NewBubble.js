

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

var width = 1400,
    height = 900,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;


width = getUrlParameter('width');

var color = d3.scale.ordinal()
      .range(["#7A99AC", "#E4002B"]);

d3.text("data/words.csv", function(error, text) {
  if (error) throw error;
  var colNames = "text,size,group\n" + text;
  var data = d3.csv.parse(colNames);

  data.forEach(function(d) {
    d.size = +d.size;
  });


var tableCount = 0;

var tablePos = [];
var originalTablePosX = [];
var originalTablePosY = [];

//unique cluster/group id's
var cs = [];
data.forEach(function(d){
    if(!cs.contains(d.group)) {
        cs.push(d.group);
    }
  
    tableCount += 1;
});

var totalWidthTable = width;
if (totalWidthTable > 1200){
    totalWidthTable = 1200;
}


var icPortion = totalWidthTable/tableCount
var iC;
for (iC = 0; iC < tableCount; iC++) {
    tablePos.push(icPortion * (iC + 1) * 2)
}

var n = data.length, // total number of nodes
    m = cs.length; // number of distinct clusters

//create clusters and nodes
var clusters = new Array(m);
var nodes = [];
for (var i = 0; i<n; i++){
    nodes.push(create_nodes(data,i));
}

var formatDecimal2 = d3.format(".0f");

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(.02)
    .charge(0)
    .on("tick", tick)
    .start();

var svg = d3.select("#bubble").append("svg")
    .attr("id", "svgBubble")
    .attr("width", width)
    .attr("height", height);

var node = svg.selectAll("circle")
    .data(nodes)
    .enter().append("g")
    .attr('id', d => 'g_'+ d.text.replace(' ', '_'))
    .attr('class', 'MovingNode')
    .attr('radius', d => formatDecimal2(d.radius))
    .attr('text', d => d.text)
    .attr('index', d => nodes.indexOf(d))
    .attr('cluster', d => d.cluster)
    .call(force.drag);

node.append("circle")
    
    .style("fill", function (d) {
        return color(d.cluster);
    })
    .attr("r", function(d){return d.radius})
    .append("svg:title")
    .text(d => d.text + ': ' + formatDecimal2(d.radius));
   
    
node.append("text")
    .attr("class", "BubbleText")
    .attr("dy", ".3em")
    .style("text-anchor", "middle")
    .text(function(d) { return d.text })
    .append("svg:title")
    .text(d => d.text + ': ' + formatDecimal2(d.radius));


node.append("text")
    .attr("dy", "10em")
    .attr("class", "BubbleTableValue")
    .style("text-anchor", "middle")
    .text(d => formatDecimal2(d.radius))
    .attr("opacity", 0)
    .attr("fill", "#4682b4")

$(function(){
    
    // if(width < 1400){
    //     $('#divArrayViewBubble').hide();
    // }

    $("#cbToggleBubble").change(function() {
        $("#cbToggleBubble").attr("disabled", true);
        $("#lbToggleBubble").attr("for", "");
        $("#lbToggleBubble").css("opacity", "0.3");

        var g = d3.selectAll('.MovingNode');

        if ($(this).is(':checked'))
        {
            force.on("tick", null);
            g.each(
                function(d,i) { 
                    gElement = d3.select(this);
                    var string = gElement.attr("transform");
                    translate = string.substring(string.indexOf("(")+1, string.indexOf(")")).split(",");
                    originalTablePosX[i] = translate[0];
                    originalTablePosY[i] = translate[1];
                    var XP = tablePos[i];         
                    var YP = height/6

                    if (totalWidthTable < 1200)
                    {
                        var XSection = Math.floor(g[0].length/4)
                        var radius = parseInt(gElement.attr("radius"));
                        
                        if(gElement.attr('cluster') == '1')
                        {
                            if(i > XSection * 3)
                            {
                                XP = XP + radius + i * 15  - width * 2.0;
                                YP = YP * 5;
                            }
                            else{
                                XP = XP + radius + i * 15 - width * 1.3;
                                YP = YP * 3.5;
                            }
                        }
                        else{
                            var preRadius = 0;
                            if (i > 0 ) {
                                let pi = i - 1;
                                preRadius = parseInt(d3.select('#' + g[0][pi].id).attr("radius"));
                            }

                            if(i > XSection)
                            {
                                XP = XP + preRadius + i * 20  - width * 0.6;
                                YP = YP * 2;
                            }
                            else{
                                XP = XP + preRadius + i * 25  //- width * 1;
                                YP = YP * 0.5;
                            }
                        }
                    }
                    else{
                        if(gElement.attr('cluster') == '1')
                        {
                            XP = XP - width/7 * 6;
                            YP = YP * 3;
                        }
                    }


                    gElement
                        .transition().duration(1000)
                        .attr('transform', `translate(${XP}, ${YP})`);
                }
            );

            if (totalWidthTable >= 1200)
            {
                d3.selectAll('.BubbleTableValue').transition().duration(500).attr('opacity', 1).attr('dy', '10em');
                d3.selectAll('.BubbleText').transition().duration(500).attr('dy', '8em');
            }
            else{
                d3.selectAll('.BubbleTableValue').transition().duration(500).attr('opacity', 1).attr('dy', (d, i) => ( i%2 == 0 ? '6.5em': '-2.5em'));
                d3.selectAll('.BubbleText').transition().duration(500).attr('dy', (d, i) => (i%2 == 0 ?'4em': '-4em'));
            }
        }
        else
        {
            g.each(
                function(d,i) { 
                    d3.select(this)
                        .transition().duration(1000)
                        .attr('transform', `translate(${originalTablePosX[i]},${originalTablePosY[i]})`);
                }
            );
            
            setTimeout(function(){ 
                force.on("tick", tick).start();
            }, 1600);

            d3.selectAll('.BubbleTableValue').transition().duration(500).attr('opacity', 0)
            d3.selectAll('.BubbleText').transition().duration(500).attr('dy', '.3em');
        }

        setTimeout(function(){ 
            $("#cbToggleBubble").removeAttr("disabled");
            $("#lbToggleBubble").attr("for", "cbToggleBubble");
            $("#lbToggleBubble").css("opacity", "1");
        }, 1600);
    });
})

function create_nodes(data,node_counter) {
    var sizeFactor = 1.0;

    if(width < 800){
        sizeFactor = 0.8;
    }
 
  var i = cs.indexOf(data[node_counter].group),
      r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
      d = {
        cluster: i,
        radius: data[node_counter].size* sizeFactor,
        text: data[node_counter].text,
        x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
        y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
      };
  if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
  return d;
};



function tick(e) {
    node.each(cluster(10 * e.alpha * e.alpha))
        .each(collide(.5))
    .attr("transform", function (d) {
        var k = "translate(" + d.x + "," + d.y + ")";
        return k;
    })

}

// Move d to be adjacent to the cluster node.
function cluster(alpha) {
    return function (d) {
        var cluster = clusters[d.cluster];
        if (cluster === d) return;
        var x = d.x - cluster.x,
            y = d.y - cluster.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + cluster.radius;
        if (l != r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            cluster.x += x;
            cluster.y += y;
        }
    };
}

// Resolves collisions between d and all other circles.
function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function (d) {
        var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function (quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                if (l < r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
}
});

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};


