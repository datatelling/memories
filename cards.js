var memorydata; // a global

d3.json("memories.json", function(error, json) {
  if (error) return console.warn(error);
  memorydata = json;
  // console.log(memorydata);
  createMemoryDivs();
});


function createMemoryDivs() {

	var memories = d3.select("#memorywrapper").selectAll("div")
	                                    .data(memorydata.memories)
	                                    .enter()
	                          			.append("div")
	                          			.attr("class", function(d) {return "memory " + d.category + " " + d.subcategory});
	memories.append("p")
	        .attr("class", "firstName")
	        .text(function(d) {return d.firstName})

	memories.append("p")
	        .attr("class", "lastName")
	        .text(function(d) {return d.lastName})

	memories.append("p")
	        .attr("class", "memtext")
	        .text(function(d) {return d.text})

	// console.log(memories);

}