
//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.event === "createMenu"){
      dewDropBg.createMenu({});
      return;
    } else {
      chrome.pageAction.show(sender.tab.id);
      sendResponse();
    }
  });


//object to help us do things in the background page
var dewDropBg = {
  createMenu: function(options){
    chrome.contextMenus.create({
      "title": "dewDrop",
      "contexts": ["link"],
      "onclick": function(){console.log('context menu clicked')}
    });
  },
  template: function(){
    //get the template from the html page

  }
};

