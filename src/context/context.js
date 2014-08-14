
var dewDrop = {
  template: {}, //keep the template here
  network: '', //what network are we on? facebook, reddit, etc
  user:{supports:[], distrusts: [], supporters:[], personInQuestion:{}}, //whats the point of using loose type if I am doing it here ARGGG
  author: {}, //aka the user on the site
  subject: {}, //user we will trust/distrust
  init: function(){
    //set the network type based on the url
    this.setNetwork();
    //bind functions to keep proper context
    this.trustAuthor = _.bind(this.trustAuthor, this);
    this.distrustAuthor = _.bind(this.distrustAuthor, this);
    this.getBackendData();
    this.createContexMenu();
    this.getTemplate();
    this.listenEvents();
    //get the facebookid of the extension user
    this.author.user = this.getAuthor();
    //this.modal();
  },
  listenEvents: function(){
    var that = this;
    //listen to future button clicks even though they haven't been inserted into the DOM yet
    $(document).on('click', '#distrustUser', this, this.distrustAuthor);
    $(document).on('click', '#trustUser', this, this.trustAuthor);
    //unrender with modal is closed
    //$(document).on('click', '#closeModal', this, this.unrender);
    //listen for events from background.js
    chrome.runtime.onMessage.addListener(function(request, sender, sendReponse){
      if (request.event === "menuClicked"){
        //if the event triggered was the menu click, do the following
        that.render(request.context); //pass in context/info about the menu click
      }
    });
  },
  render: function(context){
    //get the userid data
    this.getSubject(context);
    //get the name data
    this.getName(context);
    //add element that contains the information for our modal to the body
    $('body').append(this.template(this.subject));
    //if trust the user, remove the trust button, otherwise remove the other button
    if (this.checkTrust(this.subject.user)){
      $('#dewDrop').find('#trustUser').hide();
      $('#dewDrop').find('#distrustUser').show();
    } else {
      $('#dewDrop').find('#distrustUser').hide();
      $('#dewDrop').find('#trustUser').show();
    }
    //go ahead and trigger the dialog
    $("#dewDrop").modal({

    });
    //add event handler
    $('#dewDrop').on('hidden.bs.modal', this.unrender);
  },
  unrender: function(){
    //call this when we are done with our modal
    $('#dewDrop').remove();
  },
  createContexMenu: function(){
    //send message to background page for menu creation.
    chrome.extension.sendMessage({"event": "createMenu"}, function(response){
      console.log("creating menu " + response);
    });
  },
  setNetwork: function(context){
    //figure out what network we are in
    if (window.location.href.indexOf('reddit')){
      this.network = 'reddit';
    } else if (window.location.href.indexOf('facebook')){
      this.network = 'facebook';
    } else {
      throw new Error("Couldn't figure out network");
    }
  },
  getTemplate: function(){
    //keep context
    var that = this;
    chrome.extension.sendMessage({"event": "getTemplateHTML"}, function(template){
      console.log("getting template from background page");
      //save the template in our dewDrop object for future use
      that.template = _.template(template);
    });
  },
  getSubject: function(context){
    //function takes the clicked link and makes it into a reddit id
    //TODO make the property name of the id clicked site agnostic
    this.subject.user = context.selectionText;
    return this.subject.user;
  },
  getName: function(context){
    //function takes the context of the link the menu item was clicked on and returns name
    this.subject.name = context.selectionText;
    return this.subject.name;
  },
  getAuthor: function(){
    //function gets the id of the logged in user
    return $('.user').find('a').text();
  },
  trustAuthor: function(event){
    this.author.trusts = _.union(this.author.trusts, this.subject.user);
    //save the id as trusted (testing)
    this.setBackendData({content: "trust"});
  },
  distrustAuthor: function(event){
    this.author.trusts = _.without(this.author.trusts, this.subject.user);
    this.setBackendData({content: "distrust"});
  },
  checkTrust: function(userId){
    //go through our list of users we support and see if there is a match
    return _.contains(this.author.trusts, this.subject.user);
  },
  setBackendData: function(options){
    //save the user details to the server
    $.ajax({
      type: "POST",
      url: "http://dewdrop.neyer.me/make-statement",
      contentType: "application/json",
      dataType: "json",
      async: true,
      data: JSON.stringify({
        "author_name" : dewDrop.author.user.toString(),
        "author_network" : dewDrop.network,
        "subject_name" : dewDrop.subject.user,
        "subject_network" : dewDrop.network,
        "content" : options.content
      }),
      success: function(data){

      },
      failure: function(err){

      }
    });
  },
  getBackendData: function(){
    //get the user details from the server of everyone you trust from the server
    var trustXHR = $.getJSON("http://dewdrop.neyer.me/trust/statements-by-user/" + this.network + "/" + this.getAuthor(), function(){

    })
    .done(function(data){
      //get only the list of usernames as this tells us who we currently trust
      //we don't care about false because we assume we trust no one unless we explicit
      dewDrop.author.trusts = _.pluck(_.where(data, {trust: true}), 'name');
      //now that we have the databack from the user, store it in local storage for easy-ish access
      localStorage.author = {};
      localStorage.author.trusts = [];
      localStorage.author.trusts = JSON.stringify(dewDrop.author.trusts);
    });
  }
};


chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    // ----------------------------------------------------------
    // This part of the script triggers when page is done loading
    console.log("Hello. This message was sent from src/context/context.js");
    // ----------------------------------------------------------
    dewDrop.init();

  }
  }, 5);
});

