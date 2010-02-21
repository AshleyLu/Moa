dojo.provide("wwwmoa.client.Client");
dojo.require("dijit.Dialog");
dojo.require("dijit._Widget");

dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.TabContainer");

dojo.require("wwwmoa.client.dhm.FSBrowser");
dojo.require("wwwmoa.client.dhm.PBrowser");
dojo.require("wwwmoa.client.dhm.JobParamEditor");
dojo.require("wwwmoa.client.dhm.FileViewer");
dojo.require("wwwmoa.client.dhm.JobStatusViewer");
dojo.require("wwwmoa.client.dhm.NavPanel");

dojo.addOnLoad(function() {
	dojo.declare("wwwmoa.client.Client", dijit._Widget, {

		uiComp : {},
		uiCompDHM : [],
		_isCurrentlyModal : false,

		startup : function() {
		    if(this.uiComp.parent==null)
			return;

		    this.uiComp.parent.startup();
		    
		},

		buildRendering : function() {
		    this.uiComp.parent=new dijit.layout.BorderContainer({style : "width:100%; height:700px", gutters : "true", liveSplitters: true});

		    this.domNode=dojo.create("div", null);
		    this.domNode.appendChild(this.uiComp.parent.domNode);

		    this.uiComp.nav=new dijit.layout.ContentPane({region : "top", splitter : false, style : "height:40px"});

		    this.uiComp.parent.addChild(this.uiComp.nav);

		    this.uiComp.navpanel=new wwwmoa.client.dhm.NavPanel({style : {display : "inline"}});
		    this.uiCompDHM.push(this.uiComp.navpanel);

		    this.uiComp.nav.containerNode.appendChild(this.uiComp.navpanel.domNode);

		    this.uiComp.nav.containerNode.appendChild(dojo.create("span", {innerHTML : " | "}));

		    this.uiComp.navbreadcrumb=dojo.create("span", {style : {marginRight : "20px"}});

		    this.uiComp.nav.containerNode.appendChild(this.uiComp.navbreadcrumb);


		    this.uiComp.fsbrowserpane=new dijit.layout.ContentPane({region : "leading", style : "width:300px", splitter : true});

		    this.uiComp.parent.addChild(this.uiComp.fsbrowserpane);

		    this.uiComp.fsbrowser=new wwwmoa.client.dhm.FSBrowser({style : "padding:6px"});
		    this.uiCompDHM.push(this.uiComp.fsbrowser);

		    dojo.place(this.uiComp.fsbrowser.domNode, this.uiComp.fsbrowserpane.domNode);

		    this.uiComp.tab=new dijit.layout.TabContainer({region : "center", splitter : true});

		    this.uiComp.parent.addChild(this.uiComp.tab);




		    this.uiComp.jobstatusviewerpane=new dijit.layout.ContentPane({title : "Job Status",
										  region : "leading"
			});

		    this.uiComp.tab.addChild(this.uiComp.jobstatusviewerpane);

		    this.uiComp.jobstatusviewer=new wwwmoa.client.dhm.JobStatusViewer({});
		    this.uiCompDHM.push(this.uiComp.jobstatusviewer);

		    dojo.place(this.uiComp.jobstatusviewer.domNode, this.uiComp.jobstatusviewerpane.domNode);





		    this.uiComp.pbrowserpane=new dijit.layout.ContentPane({title : "Job View", region : "leading", style : "width:300px", splitter : true});

		    this.uiComp.tab.addChild(this.uiComp.pbrowserpane);

		    this.uiComp.pbrowser=new wwwmoa.client.dhm.PBrowser({});
		    this.uiCompDHM.push(this.uiComp.pbrowser);

		    dojo.place(this.uiComp.pbrowser.domNode, this.uiComp.pbrowserpane.domNode);


		    this.uiComp.jobparameditorpane=new dijit.layout.ContentPane({title : "Job Parameters", region : "leading", style : "width:300px", splitter : true});

		    this.uiComp.tab.addChild(this.uiComp.jobparameditorpane);

		    this.uiComp.jobparameditor=new wwwmoa.client.dhm.JobParamEditor({});

		    this.uiCompDHM.push(this.uiComp.jobparameditor);

		    dojo.place(this.uiComp.jobparameditor.domNode, this.uiComp.jobparameditorpane.domNode);

		   
		    this.uiComp.bottom=new dijit.layout.ContentPane({region : "bottom", splitter : false, id : "smallnotices", content : "This is the pre-release version of WWWMoa.<br>WWWMoa is powered by <a href=\"/go/python\">Python</a> and <a href=\"/go/dojo\">Dojo Toolkit</a>. Best viewed in <a href=\"/go/firefox\">Firefox Web Browser</a>."});

		    this.uiComp.parent.addChild(this.uiComp.bottom);

		    for(var x=0; x<this.uiCompDHM.length; x++) 
			this.uiCompDHM[x].dhmPoint(this);

		    this._initNav();
		},

		_initNav : function() {
		    this._initNavWD=wwwmoa.io.cookie.get("WWWMOA_WD");

		    this._initNavWD=(this._initNavWD==null ? "" : this._initNavWD);

		    wwwmoa.io.ajax.get(wwwmoa.io.rl.get_api("s", this._initNavWD),
				       dojo.hitch(this, this._initNavCallback),
				       3000);
		},

		_initNavCallback : function(data) {
		    if(data==null)
			this._initNavWD="";
		    else {
			var response=wwwmoa.formats.json.parse(data);

			if(response.size!=-1)
			    this._initNavWD="";
		    }

		    this.dhmRequest({
			    type : wwwmoa.dhm.DHM_REQ_WDNAV,
			    args : {path : this._initNavWD}
			});
		},

                dhmRequest : function(request, dhm) {
		    var poll_good;
		    var poll_ret;

		    if(request.type==wwwmoa.dhm.DHM_REQ_MODAL) {

			var modal_layout;
			var modal_container;
			var modal_exit;

			if(this._isCurrentlyModal)
			    return false;


			modal_layout=new dijit.layout.BorderContainer({style : "width:100%; height:700px", gutters : "true", liveSplitters: true});

			modal_container=new dijit.layout.ContentPane({region : "center", splitter : false, style : ""});

			modal_exit=new dijit.layout.ContentPane({region : "leading", splitter : false, style : "width:100px; font-size:36pt; font-weight:bold; cursor:pointer; text-align:center", content : "<div style=\"font-size:14pt\">CLICK<br>TO<br>RETURN</div><div title=\"Click to return to main view.\">&laquo;<br>&laquo;<br>&laquo;</div>"});

			modal_layout.addChild(modal_container);

			modal_layout.addChild(modal_exit);


			this._isCurrentlyModal=true;

			for(var x=0; x<this.uiCompDHM.length; x++) 
			    this.uiCompDHM[x].dhmNotify({type : wwwmoa.dhm.DHM_MSG_DISPLAY_LOCK, args : {}});


			this.domNode.removeChild(this.uiComp.parent.domNode);
			this.domNode.appendChild(modal_layout.domNode);


			modal_layout.startup();

			if(dhm!=null)
			    dhm.dhmNotify({type : wwwmoa.dhm.DHM_MSG_MODAL_GAIN_CTRL, args : {node : modal_container.containerNode}});

			dojo.connect(modal_exit, "onMouseEnter", function() { this.domNode.style.color="#808080"; });
			dojo.connect(modal_exit, "onMouseLeave", function() { this.domNode.style.color="#000000"; });

			dojo.connect(modal_exit, "onClick", dojo.hitch(this, function() {
				modal_layout.destroy(false);

				this.domNode.appendChild(this.uiComp.parent.domNode);

				this._isCurrentlyModal=false;

				dhm.dhmNotify({type : wwwmoa.dhm.DHM_MSG_MODAL_LOOSE_CTRL, args : {node : modal_container.containerNode}});

				for(var x=0; x<this.uiCompDHM.length; x++)
				    this.uiCompDHM[x].dhmNotify({type : wwwmoa.dhm.DHM_MSG_DISPLAY_UNLOCK, args : {}});
			    }));

			return true;
		    }
		    else if(request.type==wwwmoa.dhm.DHM_REQ_WDNAV) {
			if(request.args.path==null)
			    return null;
			
			poll_good=true;

			for(var x=0; x<this.uiCompDHM.length; x++) {
			    poll_ret=this.uiCompDHM[x].dhmPoll({type : wwwmoa.dhm.DHM_PLL_WDNAV, args : { path : request.args.path }});

			    if(poll_ret==null)
				poll_good=false;
			    else
				poll_good=poll_good&&poll_ret;
			}

			if(poll_good) {
			    for(var x=0; x<this.uiCompDHM.length; x++)
				this.uiCompDHM[x].dhmNotify({type : wwwmoa.dhm.DHM_MSG_WDNAV, args : { path : request.args.path }});

			    wwwmoa.io.cookie.set("WWWMOA_WD", request.args.path, true);
			}

			return poll_good;
		    }
		    else if(request.type=wwwmoa.dhm.DHM_REQ_FILEACTION) {
			var container;
			var fileviewer;
			var title;

			if(request.args.path==null)
			    return null;

			fileviewer=new wwwmoa.client.dhm.FileViewer({});

			title=request.args.path;

			if(title.length>24)
			    title="..."+title.substr(title.length-21, 21);

			title=wwwmoa.formats.html.fix_text(title);

			container=new dijit.layout.ContentPane({title : title,
								closable : true,
								onClose : function() {
								    fileviewer.destroy();
								    return true;
								}
			    });

			this.uiComp.tab.addChild(container);
			this.uiComp.tab.selectChild(container);

			dojo.place(fileviewer.domNode, container.domNode);

			fileviewer.attr("location", request.args.path);

			return true;
		    }
		    else {
			return null;
		    }
		},

		dhmNotify : function(message, dhm) {
		    if(message.type==wwwmoa.dhm.DHM_MSG_DATA) {
			if(dhm==this.uiComp.fsbrowser) {
			    if(message.args.key=="locationBreadcrumbNode") {
				dojo.empty(this.uiComp.navbreadcrumb);
				this.uiComp.navbreadcrumb.appendChild(message.args.data);
			    }
			}
		    }
		}		


	    })});




