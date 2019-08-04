var keyArray = ["Average Temperature (F)","Average Precipitation (in.)","Average Tornadoes","Average Clear Days","Average Summer Humidity (%)"];
var expressed = keyArray[0];

window.onload = initialize();

function initialize(){
	setMap();
};

function setMap(){	
	var width = 960;
	var height = 600;

    var title = d3.select("body")
	 	.append("h1")
	 	.text("Contiguous United States Weather Averages by State");
    var text = d3.select("body")
	 	.append("h3")
	 	.text("Map data is derived from weather reports from 1971 - 2015 collected by the National Weather Service.");
	
	var map = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "map");
	
	var projection = d3.geo.albersUsa()
		.scale(1280)
		.translate([width / 2, height / 2]);
	
	var path = d3.geo.path()
		.projection(projection);

	var graticule = d3.geo.graticule()
		.step([10, 10]);

	queue()
		.defer(d3.csv, "data/states_data.csv")
		.defer(d3.json, "data/states.topojson")
		.await(callback);

	function callback(error, csvData, statesData){
		
		var recolorMap = colorScale(csvData);

		var jsonRegions = statesData.objects.states.geometries;
			
		for (var i=0; i<csvData.length; i++) {		
			var csvRegion = csvData[i];
			var csvAdm1 = csvRegion.adm1_code;
			
			for (var a=0; a<jsonRegions.length; a++){
				
				if (jsonRegions[a].properties.adm1_code == csvAdm1){
					
					for (var key in keyArray){
						var attr = keyArray[key];
						var val = parseFloat(csvRegion[attr]);
						jsonRegions[a].properties[attr] = val;
					};
					
					jsonRegions[a].properties.name = csvRegion.name;
					break;
				};
			};
		};

		var regions = map.selectAll(".regions")
			.data(topojson.feature(statesData, statesData.objects.states).features)
			.enter()
			.append("path")
			.attr("class", "regions")
			.attr("id", function(d) { return d.properties.adm1_code })
			.attr("d", path)
			.style("fill", function(d) {
				return choropleth(d, recolorMap);
			})
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel)
			.append("desc")
				.text(function(d) {
					return choropleth(d, recolorMap);
				});

		createDropdown(csvData);

	};
};

function createDropdown(csvData){
	var dropdown = d3.select("body")
		.append("div")
		.attr("class","dropdown")
		.html("<h3>Data Selection:</h3>")
		.append("select")
		.on("change", function(){ changeAttribute(this.value, csvData) });
	
	dropdown.selectAll("options")
		.data(keyArray)
		.enter()
		.append("option")
		.attr("value", function(d){ return d })
		.text(function(d) {
			d = d[0].toUpperCase() + d.substring(1,3) + " " + d.substring(3);
			return d
		});
};

function colorScale(csvData){
		
	var color = d3.scale.quantile()
		.range([
			"#ffa500",
			"#cc8400",
			"#996300",
			"#664200",
			"#332100"
		]);
	
	var domainArray = [];
	for (var i in csvData){
		domainArray.push(Number(csvData[i][expressed]));
	};
	
	color.domain(domainArray);
	
	return color;
};

function choropleth(d, recolorMap){
	
	var value = d.properties[expressed];
	if (value) {
		return recolorMap(value);
	} else {
		return "#ccc";
	};
};

function changeAttribute(attribute, csvData){
	expressed = attribute;
	
	d3.selectAll(".regions")
		.style("fill", function(d) {
			return choropleth(d, colorScale(csvData));
		})
		.select("desc")
			.text(function(d) {
				return choropleth(d, colorScale(csvData));
			});
};

function highlight(data){
	
	var props = data.properties;

	d3.select("#"+props.adm1_code)
		.style("fill", "#081345");

	var labelAttribute = "<h1>"+props[expressed]+
		"</h1><br><b>"+expressed+"</b>";
	var labelName = props.name
	
	var infolabel = d3.select("body")
		.append("div")
		.attr("class", "infolabel")
		.attr("id", props.adm1_code+"label")
		.html(labelAttribute)
		.append("div")
		.attr("class", "labelname")
		.html(labelName);
};

function dehighlight(data){
	
	var props = data.properties;
	var region = d3.select("#"+props.adm1_code);
	var fillcolor = region.select("desc").text();
	region.style("fill", fillcolor);
	
	d3.select("#"+props.adm1_code+"label").remove();
};

function moveLabel() {
	
	var x = d3.event.clientX+10;
	var y = d3.event.clientY-75;
	d3.select(".infolabel") 
		.style("margin-left", x+"px")
		.style("margin-top", y+"px"); 
};
