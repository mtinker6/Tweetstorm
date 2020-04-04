    
//#Reference: Code below is based on Gatech CSE6242 2020 Spring Homework 2 Question 2 

function CreateFDGraph(){
    d3.csv("data/debateGraph.csv",
    rawrow => ({
        source : rawrow['source'],
        target : rawrow['target'],
        Date : rawrow['Date'],
        value : +rawrow['value']
    })

    ).then(
    data => {

    var links = data.filter(d => d.Date == "election_day" && d.source != d.target && d.value > 30);

    var nodes = {};
    
    // compute the distinct nodes from the links.
    links.forEach(function(link) {
        ////asign class depends on value
        link.type = link.value < 300 ? "LightLink" : "HeavyLink";

        link.source = nodes[link.source] ||
            (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] ||
            (nodes[link.target] = {name: link.target});
    });
    
    //*calculate degree
    var maxDegree = 0;
    var nodeValues = d3.values(nodes);
    nodeValues.forEach(
        node => {
            node.degree = links.filter(l => l.target.name == node.name || l.source.name == node.name).length;
            if(node.degree > maxDegree) {
                maxDegree = node.degree;
            }
        }
    );

    var width = 1400,
        height = 800;

    var svgFDGraph = d3.select("#forceDirectedGraph").append("svg")
                .attr("width", width)
                .attr("height", height);
    
    var force = d3.forceSimulation()
        .nodes(d3.values(nodes))
        .force("link", d3.forceLink(links).distance(100))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody().strength(-250))
        .alphaTarget(1)
        .on("tick", tick);

    
    
    // add the links and the arrows
    var path = svgFDGraph.append("g")
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("class", function(d) { return "link " + d.type; });
    
    // define the nodes
    var node = svgFDGraph.selectAll(".node")
        .data(force.nodes())
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    
    // add the nodes
    var rScale = d3.scaleLinear()
    .domain([0, maxDegree])
    .range([1, 20]);

    //*set up color scaler
    var fillScale = d3.scaleLinear()
        .domain([0, maxDegree])
        .range(['#fde0dd','#c51b8a']);

    node.append("circle")
        .attr("r", (d, i) => rScale(d.degree))
        .attr("fill", (d, i) => fillScale(d.degree))
        .on("dblclick", dblclick); //*wire up double click events
    
    //*append node names
    node.append("text")
        .text(n => n.name)
        .attr("class", "NodeText")
        .attr("dy", n => 10);

    // add the curvy lines
    function tick() {
        path.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" +
                d.source.x + "," +
                d.source.y + "A" +
                dr + "," + dr + " 0 0,1 " +
                d.target.x + "," +
                d.target.y;
        });
    
        node
            .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; })
    };

    //*handle double click
    function dblclick(d) {
        var currentCircle = d3.select(this);
        if(d.fixed == true){
            currentCircle.classed("fixed", false);
            d.fixed = false;
            d.fx = null;
            d.fy = null;
        }
        else {
            currentCircle.classed("fixed", true);
            d.fixed = true;
            d.fx = d.x;
            d.fy = d.y;
        }
    }
    
    function dragstarted(d) {
        if (!d3.event.active) force.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    };
    
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    };
    
    function dragended(d) {
        if (!d3.event.active) force.alphaTarget(0);
        if (d.fixed == true) {
            d.fx = d.x;
            d.fy = d.y;
        }
        else {
            d.fx = null;
            d.fy = null;
        }
    };


    })
}