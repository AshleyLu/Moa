
dojo.provide("wwwmoa.client.dhm.PBrowser");

dojo.require("wwwmoa.client.job.Params");
dojo.require("dijit._Widget");

dojo.require("dijit.Tooltip");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dijit.form.Button");
dojo.require("dojo.string");


dojo.addOnLoad(function() {dojo.declare("wwwmoa.client.dhm.PBrowser", dijit._Widget, {

	    _visualDOM : null,
	    _locked : false,
	    _response : null,
	    _location : "",
	    _assumeNoProject : false,
	    _params : null,
	    _localParams : {},
	    _saveButtons : [],
	    _savesCompleted : 0,
	    _savesTotal : 0,
	    _dhmManager : null,


	    _setVisualDOMAttr : function(val) {
		this._visualDOM=val;
		this.refreshVisualElement();
	    },

	    _getVisualDOMAttr : function() {
		return this._visualDOM;
	    },

	    _setVisualCodeAttr : function(val) {
		if(val==null) {
		    this.attr("visualDOM", null);
		    return;
		}
		this.attr("visualDOM", dojo.create("div", {innerHTML : val}));
	    },

	    _getVisualCodeAttr : function() {
	        if(this.attr("visualDOM")==null)
		    return null;

		return this.attr("visualDOM").innerHTML;
	    },

	    _setLockedAttr : function(val) {
		this._locked=val;
	    },

	    _getLockedAttr : function() {
		return this._locked;
	    },

            _setResponseAttr : function(val) {
		this._response=val;
	    },

	    _getResponseAttr : function() {
		return this._response;
	    },

	    _setLocationAttr : function(val) {
		this._location=val;
		this.doNavAction();
	    },

	    _getLocationAttr : function() {
		return this._location;
	    },

	    _setAssumeNoProject : function(val) {
		this._assumeNoProject=val;
	    },

	    _getAssumeNoProject : function() {
		return this._assumeNoProject;
	    },

	    constructor : function() {
		this.doNoProjectAction();
	    },

	    buildRendering : function() {
		this.domNode=dojo.create("div", null);
		this.refreshVisualElement();
	    },


	    // Implementation for receiving instruction to find job information for current location.
	    doNavAction : function() {
		var a=this;
		
		if(this.attr("assumeNoProject")) {
		    this.doNoProjectAction();
		    return;
		}

		this.attr("visualCode", null);
    
		this.attr("locked", true);

		wwwmoa.io.ajax.get(wwwmoa.io.rl.get_api("moa-jobinfo", this.attr("location")),function(data) {
			a.dataCallback.call(a, data); // use the callback function of this object
		    } , 8192); // be somewhat patient about receiving the listing
	    },

	    // Implementation for handling the case when a project has not be selected.
	    doNoProjectAction : function() {
		this.attr("visualCode", "No Moa job information is available.");
	    },

	    // Takes the previously generated HTML and packages it for viewing.  Then,
            // it pushes the HTML code into the visual element so that it is visible.
	    refreshVisualElement : function() {
		
		if(this.domNode==null) // if we do not have a visual element
		    return; // there is no reason to proceed
		
		dojo.empty(this.domNode);

		if(this.attr("visualDOM")==null) // if either the main code or the current directory item code is not present
		    this.domNode.innerHTML="Loading job information..."; // create loading message
		else { // if both the main code and the current directory item code is present
		    this.domNode.appendChild(this.attr("visualDOM"));
		}
	    },

	    
            // Receives data from the API request.  Then, it creates the HTML code that
            // will be used to display the job view contents.  Finally, it requests an
            // update of the visual element.
            dataCallback : function(data) {
		var response=wwwmoa.formats.json.parse(data); // attempt a parse of the received data
		var buf_tmp=""; // temporary buffer for visual code
		var buf_final=""; // buffer for the final visual code
		var dom_final=null; // holds the DOM that all of the final visual elements get attached to
		var dom_tmp=null; // holds a piece of the DOM temporarily
		var cur_param=""; // holds the current parameter dictionary
		var cur_value=[]; // holds the values for the current parameter; often, just one value will be present
		var cur_widget=null; // holds the widget that is currently being operated on
		var obj_tmp=null; // holds an object temporarily
		var buf_cat={}; // dictionary for category visual code
		var buf_req=[]; // temporary array for holding required parameters in the current category
		var buf_notreq=[]; // temporary array for hold paramters that are not required in the current category
		var type_known; // holds whether the current parameter's type has been recognized
		var card_many; // holds whether the current parameter has a cardinality of "many"
		var safe_type; // holds the current parameter's converted type
		var groups;
		var group_params;
		var param;
		var a=this;

		this.attr("response", response); // save the parsed response we have received for later use
		
		if(data==null) { // if null was passed, we have an error
		    this.attr("visualCode", "No job information is available."); // create an error message
		    this.attr("locked", false);
		    return;
		}

		// create params store
		this._params=new wwwmoa.client.job.Params();

		// decode params
		this._params.setParams(this._params.transParamsOTI(response["parameters"]));
		
		// create parent DOM node
		dom_final=dojo.create("div", null);
		
		// create DOM structure for general information section
		dom_final.appendChild(dojo.create("span", {
			    style : {
		                    fontWeight : "bold",
				    textDecoration : "underline"
				},
				innerHTML : "Template Information"
			    })); // create section heading
		dom_final.appendChild(dojo.create("br", null));

		dom_final.appendChild(document.createTextNode("Title: ")); // create title label
		
		if(response["moa_title"]=="") // if a title does not exist
		    dom_final.appendChild(dojo.create("span",{
				style : {fontStyle : "italic"},
				innerHTML : "Untitled"
			    })); // use "Untitled"
		else // if a title does exist
		    dom_final.appendChild(document.createTextNode(response["moa_title"])); // use it
		
		dom_final.appendChild(dojo.create("br", null));

	        dom_final.appendChild(document.createTextNode("Description: ")); // create description label
						      
		if(response["moa_description"]=="") // if a description does not exist
		    dom_final.appendChild(dojo.create("span", {
				style : {fontStyle : "italic"},
				innerHTML : "No Summary"}
			    )); // say so
		else // if a description does exist
		    dom_final.appendChild(document.createTextNode(response["moa_description"])); // use it

		groups=this._params.getParamGroups();

		dom_final.appendChild(dojo.create("br", null));
		dom_final.appendChild(dojo.create("br", null));


		this._saveButtons[0]=dojo.create("button", {
			    innerHTML : "No Changes Made Yet",
			    onclick : function() {a._saveParameters()},
			    disabled : true
			});

		dom_final.appendChild(this._saveButtons[0]);



 		dom_final.appendChild(dojo.create("br", null));		


      		for(var x=0; x<groups.length; x++) {

 		    group_params=this._params.getParamsByGroup(groups[x]);
		    

		    dom_final.appendChild(dojo.create("br", null));

		    dom_final.appendChild(dojo.create("span", {
				style : {
				        fontWeight : "bold",
					textDecoration : "underline"
					},
				    innerHTML : wwwmoa.formats.html.fix_text((groups[x]=="" ? "General" : wwwmoa.util.str.title_case(groups[x]))+" Parameters")
				}));


		    

		    dom_final.appendChild(dojo.create("br", null));

		    for(var y=0; y<group_params.length; y++) {

			param=group_params[y];

		    		    
			dom_tmp=dojo.create("div", {style : {
				    border : "1px solid #A0A0A0",
				    padding : "1px",
				    marginBottom : "2px", 
				    marginTop : "1px"
				}});

			dom_tmp.appendChild(dojo.create("span", {
				    style : {fontWeight : "bold"}, 
				    innerHTML : wwwmoa.formats.html.fix_text(param.name)
				}));
		    
			if(param.required)
			    dom_tmp.appendChild(dojo.create("span", {style : {
					        fontWeight : "bold",
						color : "#FF0000"
					    },
					innerHTML : "*",
					title : "This parameter is mandatory."
				    }));


			dom_tmp.appendChild(this._createHelpNode(param));
		    
			if(param.cardinality==this._params.CARD_MANY) {
			
			    var thisnow=this;
			    obj_tmp=dojo.create("button", {
				    innerHTML : "Add New Value",
				    onclick : function() {
				    
					var default_value=thisnow._getParameterComplexDefault(this.parentNode);

					this.parentNode.appendChild(thisnow._createParameterWidgetGroup(default_value, default_value, param.type));
				    }
				});

			    dom_tmp.appendChild(obj_tmp);
			}


			dom_tmp.appendChild(dojo.create("br", null));

		    
			for(var z=0; z<( param.cardinality==this._params.CARD_MANY ? param.values.length : Math.min(param.values.length, 1)); z++) {
			    dom_tmp.appendChild(this._createParameterWidgetGroup(param.name, param.values[z], param["default"], param.type));
			}
		    

			dom_tmp.appendChild(dojo.create("input", {
				    type : "hidden",
				    name : "name",
				    value : x
					}));

			dom_tmp.appendChild(dojo.create("input", {
				    type : "hidden",
				    name : "type",
				    value : param.type
					}));

			dom_tmp.appendChild(dojo.create("default", {
				    type : "hidden",
				    name : "type",
				    value : param["default"]
					}));
			
			dom_final.appendChild(dom_tmp);

		    }
		}



		dom_final.appendChild(dojo.create("br", null));

		dom_final.appendChild(dojo.create("span", {
			    style : {
				fontWeight:"bold",
				color:"#FF0000"
				    },
			    innerHTML : "*"
			}));
		
		dom_final.appendChild(document.createTextNode("denotes mandatory parameter"));
		
		dom_final.appendChild(dojo.create("br", null));
		dom_final.appendChild(dojo.create("br", null));



		this._saveButtons[1]=dojo.create("button", {
			    innerHTML : "No Changes Made Yet",
			    onclick : function() {a._saveParameters()},
			    disabled : true
			});

		dom_final.appendChild(this._saveButtons[1]);


		
		this.attr("visualDOM", dom_final); // make main code "public"
		this.attr("locked", false);

		},

		_createHelpNode : function(param) {
		    var help_string=""; // holds the string that will be placed in the help node

		    help_string+=dojo.string.trim(param.help);

		    if(help_string=="")
			help_string="Sorry, no detailed help is available for this parameter.";

		    if(param.type==this._params.TYPE_STRING)
			help_string+=" | This parameter is a string.  A string is a piece of text.";
		    if(param.type==this._params.TYPE_INTEGER)
			help_string+=" | This parameter is an integer. An integer is a number without a fractional (or imaginary) component.";
		    

		    return dojo.create("span", {style : {
				    fontSize : "12px",
				    fontWeight : "bold",
				    color : "#008000",
				    cursor : "pointer"
				    }, 
				onmouseout : function() {this.innerHTML=" [?] ";},
				onclick : new Function("this.innerHTML=' - "+help_string+"';"),
				innerHTML : " [?] "
			    });

		},


		_createParameterWidget : function(val, type) {
		   
		    var cur_widget;

		    var style_obj= {border : "0px solid #000000", width : "85%"};

		    if(type==this._params.TYPE_STRING) {
			cur_widget=new dijit.form.TextBox({value : val, style : style_obj});
		    }
		    else if(type==this._params.TYPE_INTEGER) {
			cur_widget=new dijit.form.NumberTextBox({
				constraints: {places : 0},
				invalidMessage : "This parameter must be an integer.",
				value : val, 
				style : style_obj
			    });
		    }
		    else {
			cur_widget=new dijit.form.TextBox({
				value : "(format unknown)",
				style : style_obj,
				disabled : "true"
			    });
		    }

		    cur_widget.attr("onFocus", function() {
			     style_obj.border="1px solid #303060";
			     cur_widget.attr("style", style_obj);
			});

		    cur_widget.attr("onBlur", function() {
			     style_obj.border="0px solid #000000";
			     cur_widget.attr("style", style_obj);
			});

		    return cur_widget;
		},

		_getNewParameterValue : function(name) {
		    if(this._localParams[name]!=null)
			return this._localParams[name]();

		    return null;
		},

		_saveParameters : function() {
		    var par_names=this._params.getParamNames();
		    var par;
		    var par_changed=0;

		    this._registerSaveAttempt();

		    for(var x=0; x<par_names.length; x++) {
			par=this._params.getParam(par_names[x]);

			if((this._getNewParameterValue(par_names[x])!=null)&&(par.values[0]!=this._getNewParameterValue(par_names[x]))) {
			    this._saveParameter(par_names[x], this._getNewParameterValue(par_names[x]));
			    par_changed++;
			}
		    }

		},

		_registerChange : function() {
		    for(var x=0; x<this._saveButtons.length; x++) {
			this._saveButtons[x].disabled=false;
			this._saveButtons[x].innerHTML="Save Changes";
		    }
		},

		_registerSaveAttempt : function() {
		    for(var x=0; x<this._saveButtons.length; x++) {
			this._saveButtons[x].disabled=true;
			this._saveButtons[x].innerHTML="Saving...";
		    }
		},

		_registerSave : function() {
		    for(var x=0; x<this._saveButtons.length; x++) {
			if(this._saveButtons[x].disabled)
			    this._saveButtons[x].innerHTML="Saved";
		    }
		},

		_saveParameter : function(name, val) {
		    var a=this;

		    this._params.rewriteParam(name, val);

		    wwwmoa.io.ajax.post(wwwmoa.io.rl.get_api("moa-jobparam?key="+wwwmoa.io.rl.url_encode(name)+"&value="+wwwmoa.io.rl.url_encode(val), this.attr("location")),function(data) {
			    a._registerSave();
			} , 8192); // be somewhat patient about receiving the listing
		},

		_createParameterWidgetGroup : function(name, val, deflt, type) {
		    var a=this;
		    var par_dom=dojo.create("div", null);
		    var cur_widget;
		    var obj_tmp;

		    cur_widget=this._createParameterWidget(val, type);
		    
		    dojo.connect(cur_widget.domNode, "keypress", function() {
			a._registerChange();
			});

		    par_dom.appendChild(cur_widget.domNode);
			
		    if(type!=this._params.TYPE_UNKNOWN) {
			
			this._localParams[name]=function() { return cur_widget.attr("value"); };
		        
			obj_tmp=dojo.create("button", {
				innerHTML : "<span style=\"color:#0000FF; font-weight:bold; font-family:arial\">D</span>",
				title : "Click to use the default value.",
				onclick : new Function("dijit.byId('"+wwwmoa.formats.js.fix_text(this.id)+"')._registerChange(); dijit.byId('"+wwwmoa.formats.js.fix_text(cur_widget.id)+"').attr('value', '"+wwwmoa.formats.js.fix_text(deflt)+"');")
			    });

			par_dom.appendChild(obj_tmp);			    


		    }
		    else {
			this._localParams[name]=null;
		    }

		    return par_dom;
		},

		_getParameterComplexDefault : function(complex) {
		    var inputs=complex.getElementsByTagName("input");

		    for(var i in inputs)
			if(dojo.attr(inputs[i], "name")=="default")
			    return dojo.attr(inputs[i], "value");

		    return "";
		},

		dhmNotify : function(message) {
		    if(message.type==wwwmoa.dhm.DHM_MSG_WDNAV)
			this.attr("location", message.args.path);
		},

		dhmPoll : function(poll) {
		    if(poll.type==wwwmoa.dhm.DHM_PLL_SHUTDOWN)
			return true;
		    else if(poll.type==wwwmoa.dhm.DHM_PLL_WDNAV)
			return !this.attr("locked");
		},

		dhmPoint : function(manager) {
		    this._dhmManager=manager;
		}


	    })});
