var widthBubble = 900,
    heightBubble = 600,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;

var colorbubble = d3.scaleOrdinal()
      .range(["#7A99AC", "#E4002B"]);



d3.csv("data/words.csv",
        rawrow => ({
            text : rawrow['text'],
            size : +rawrow['size'],
            group : rawrow['group']
        })

).then(
    data => {
        //unique cluster/group id's
        var cs = [];
        data.forEach(function(d){
                if(!cs.contains(d.group)) {
                    cs.push(d.group);
                }
        });

        var n = data.length, // total number of nodes
            m = cs.length; // number of distinct clusters

        //create clusters and nodes
        var clusters = new Array(m);
        var nodes = [];
        for (var i = 0; i<n; i++){
            nodes.push(create_nodes(data,i));
        }

        // var force = d3.layout.force()
        //     .nodes(nodes)
        //     .size([widthBubble, heightBubble])
        //     .gravity(.02)
        //     .charge(0)
        //     .on("tick", tick)
        //     .start();

        var nodeforce = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-3000))
            .force("center", d3.forceCenter(widthBubble / 2, heightBubble / 2))
            .force("x", d3.forceX(widthBubble / 2).strength(1))
            .force("y", d3.forceY(heightBubble / 2).strength(1))
            .alphaTarget(0.3)
            .on("tick", tick)

        var svg = d3.select("#bubbleChart").append("svg")
            .attr("width", widthBubble)
            .attr("height", heightBubble);


        var node = svg.selectAll("circle")
                .data(nodes)
                .enter().append("g");;
    
        node.append("circle")
            .style("fill", d => colorbubble(d.cluster))
            .attr("r", function(d){return d.radius})
            

        node.append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .text(function(d) { return d.text.substring(0, d.radius / 3); });

        node.call(
                d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            );

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            if (!d3.event.active) {
                nodeforce.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
        
        function dragended(d) {
            if (!d3.event.active) {
                nodeforce.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
        }

        function updateNode(node) {
            node.attr("transform", function(d) {
                return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
            });
        }

        function fixna(x) {
            if (isFinite(x)) return x;
            return 0;
        }


        function create_nodes(data,node_counter) {
        var i = cs.indexOf(data[node_counter].group),
            r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
            d = {
                cluster: i,
                radius: data[node_counter].size*1.5,
                text: data[node_counter].text,
                x: Math.cos(i / m * 2 * Math.PI) * 200 + widthBubble / 2 + Math.random(),
                y: Math.sin(i / m * 2 * Math.PI) * 200 + heightBubble / 2 + Math.random()
            };
        if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
        return d;

        }

        
        function tick(e) {
            // node.each(cluster(2.5));
            // node.each(collide(.5))
            // node.attr("transform", function (d) {
            //     var k = "translate(" + d.x + "," + d.y + ")";
            //     return k;
            // })


            node.call(updateNode);
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
            var quadtree = d3.quadtree(nodes);
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
    }
)

// d3.text("data/words.csv", function(error, text) {
//     if (error) {
//         throw error;
//     }

//     var colNames = "text,size,group\n" + text;
//     var data = d3.csv.parse(colNames);

//     data.forEach(function(d) {
//         d.size = +d.size;
//     });


//     //unique cluster/group id's
//     var cs = [];
//     data.forEach(function(d){
//             if(!cs.contains(d.group)) {
//                 cs.push(d.group);
//             }
//     });

//     var n = data.length, // total number of nodes
//         m = cs.length; // number of distinct clusters

//     //create clusters and nodes
//     var clusters = new Array(m);
//     var nodes = [];
//     for (var i = 0; i<n; i++){
//         nodes.push(create_nodes(data,i));
//     }

//     var force = d3.layout.force()
//         .nodes(nodes)
//         .size([widthBubble, heightBubble])
//         .gravity(.02)
//         .charge(0)
//         .on("tick", tick)
//         .start();

//     var svg = d3.select("#bubbleChart").append("svg")
//         .attr("widthBubble", widthBubble)
//         .attr("heightBubble", heightBubble);


//     var node = svg.selectAll("circle")
//         .data(nodes)
//         .enter().append("g").call(force.drag);


//     node.append("circle")
//         .style("fill", function (d) {
//         return colorbubble(d.cluster);
//         })
//         .attr("r", function(d){return d.radius})
        

//     node.append("text")
//         .attr("dy", ".3em")
//         .style("text-anchor", "middle")
//         .text(function(d) { return d.text.substring(0, d.radius / 3); });




//     function create_nodes(data,node_counter) {
//     var i = cs.indexOf(data[node_counter].group),
//         r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
//         d = {
//             cluster: i,
//             radius: data[node_counter].size*1.5,
//             text: data[node_counter].text,
//             x: Math.cos(i / m * 2 * Math.PI) * 200 + widthBubble / 2 + Math.random(),
//             y: Math.sin(i / m * 2 * Math.PI) * 200 + heightBubble / 2 + Math.random()
//         };
//     if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
//     return d;
// };



// function tick(e) {
//     node.each(cluster(10 * e.alpha * e.alpha))
//         .each(collide(.5))
//     .attr("transform", function (d) {
//         var k = "translate(" + d.x + "," + d.y + ")";
//         return k;
//     })

// }

// // Move d to be adjacent to the cluster node.
// function cluster(alpha) {
//     return function (d) {
//         var cluster = clusters[d.cluster];
//         if (cluster === d) return;
//         var x = d.x - cluster.x,
//             y = d.y - cluster.y,
//             l = Math.sqrt(x * x + y * y),
//             r = d.radius + cluster.radius;
//         if (l != r) {
//             l = (l - r) / l * alpha;
//             d.x -= x *= l;
//             d.y -= y *= l;
//             cluster.x += x;
//             cluster.y += y;
//         }
//     };
// }

// // Resolves collisions between d and all other circles.
// function collide(alpha) {
//     var quadtree = d3.geom.quadtree(nodes);
//     return function (d) {
//         var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
//             nx1 = d.x - r,
//             nx2 = d.x + r,
//             ny1 = d.y - r,
//             ny2 = d.y + r;
//         quadtree.visit(function (quad, x1, y1, x2, y2) {
//             if (quad.point && (quad.point !== d)) {
//                 var x = d.x - quad.point.x,
//                     y = d.y - quad.point.y,
//                     l = Math.sqrt(x * x + y * y),
//                     r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
//                 if (l < r) {
//                     l = (l - r) / l * alpha;
//                     d.x -= x *= l;
//                     d.y -= y *= l;
//                     quad.point.x += x;
//                     quad.point.y += y;
//                 }
//             }
//             return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
//         });
//     };
// }
// });

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};