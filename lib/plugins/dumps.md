# Some dumps of packets useful for writing plugins

## Received when joining game
Could be nice to list every packets and use every informations received at loading

### Stats
>received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":67,"amount":100}
received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":68,"amount":100}
received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":12,"amount":78}
received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":0,"amount":76}
received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":2,"amount":25}
received compressed packet D2GS_SETBYTEATTR {"attribute":12,"amount":93}
received compressed packet D2GS_SETBYTEATTR {"attribute":0,"amount":93}
received compressed packet D2GS_SETBYTEATTR {"attribute":2,"amount":25}
received compressed packet D2GS_SETBYTEATTR {"attribute":0,"amount":93}
received compressed packet D2GS_SETBYTEATTR {"attribute":1,"amount":125}
received compressed packet D2GS_SETBYTEATTR {"attribute":2,"amount":25}
received compressed packet D2GS_SETWORDATTR {"attribute":3,"amount":297}
received compressed packet D2GS_SETDWORDATTR {"attribute":7,"amount":192512}
received compressed packet D2GS_SETDWORDATTR {"attribute":9,"amount":102144}
received compressed packet D2GS_SETDWORDATTR {"attribute":11,"amount":141568}
received compressed packet D2GS_SETBYTEATTR {"attribute":12,"amount":93}
received compressed packet D2GS_SETDWORDATTR {"attribute":15,"amount":1062774}
  

## Misc

### Portal opened near
>received compressed packet D2GS_TOWNPORTALSTATE {"state":3,"areaId":83,"unitId":236}
received compressed packet D2GS_PORTALOWNERSHIP {"ownerId":1,"ownerName":[99,104,101,97,112,0,0,0,22,37,2,236,0,0,0,124],"localId":236,"remoteId":235}
received compressed packet D2GS_OBJECTSTATE {"unitType":2,"unitId":236,"unknown":3,"unitState":513}
received compressed packet D2GS_GAMELOADING {}
received compressed packet D2GS_TOWNPORTALSTATE {"state":3,"areaId":83,"unitId":236}

**walking close to already opened portal**

>received compressed packet D2GS_WORLDOBJECT {"objectType":2,"objectId":203,"objectUniqueCode":59,"x":5158,"y":5068,"state":2,"interactionCondition":83}
received compressed packet D2GS_TOWNPORTALSTATE {"state":3,"areaId":83,"unitId":203}
received compressed packet D2GS_PORTALOWNERSHIP {"ownerId":2,"ownerName":[99,104,101,97,112,0,0,0,22,39,2,203,0,0,0,124],"localId":203,"remoteId":202}

### Interact with stash
    
>d2gsToServer : D2GS_RUNTOENTITY {"entityType":2,"entityId":17}
d2gsToServer : D2GS_RUNTOENTITY {"entityType":2,"entityId":17}
d2gsToServer : D2GS_INTERACTWITHENTITY {"entityType":2,"entityId":17}
d2gsToClient :  D2GS_TRADEACTION {"requestType":16}
    

### Above dump of case when npc has something to say to us (quest ...)

>d2gsToServer : D2GS_TOWNFOLK {"unk1":1,"unk2":8,"unk3":4677,"unk4":6099}
d2gsToServer : D2GS_INTERACTWITHENTITY {"entityType":1,"entityId":8}
d2gsToClient :  D2GS_NPCINFO {"unitType":1,"unitId":8,"unknown":[5,0,2,0,73,0,2,0,89,0,2,0,157,0,2,0,137,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0]}
d2gsToClient :  D2GS_GAMEQUESTINFO {"unknown":[0,0,0,0,0,0,0,0,0,160,0,0,0,128,0,0,0,32,0,0,0,0,0,160,0,160,0,128,0,128,0,0,0,0,0,0,0,128,0,0,0,0,0,160,0,160,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,128,0,0,0,0,0,0,0,128,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
d2gsToClient :  D2GS_QUESTINFO {"unknown":[1,8,0,0,0,0,1,0,12,0,8,0,8,0,25,144,20,0,25,16,1,0,1,0,0,0,1,16,5,16,129,17,5,16,37,16,1,0,0,0,0,0,1,16,0,0,0,0,9,16,1,18,1,0,0,0,4,0,1,16,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,33,16,0,0,8,0,0,0,9,16,85,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
d2gsToClient :  D2GS_NPCSTOP {"unitId":8,"x":4678,"y":6100,"unitLife":128}
d2gsToServer : D2GS_NPCINIT {"entityType":1,"entityId":8}
d2gsToServer : D2GS_QUESTMESSAGE {"unk1":8,"unk2":36}
d2gsToClient :  D2GS_NPCMOVE {"unitId":9,"type":1,"x":4713,"y":6119,"unknown":5}
d2gsToClient :  D2GS_NPCSTOP {"unitId":6,"x":4682,"y":6155,"unitLife":128}
d2gsToClient :  D2GS_NPCMOVE {"unitId":9,"type":1,"x":4712,"y":6123,"unknown":5}
d2gsToClient :  D2GS_NPCMOVE {"unitId":5,"type":1,"x":4734,"y":6117,"unknown":5}
d2gsToClient :  D2GS_NPCSTOP {"unitId":8,"x":4678,"y":6100,"unitLife":128}
d2gsToClient :  D2GS_NPCSTOP {"unitId":6,"x":4682,"y":6155,"unitLife":128}
d2gsToServer : D2GS_NPCCANCEL {"entityType":1,"npcId":8} // <=== Here i canceled his message to reinit
d2gsToClient :  D2GS_NPCSTOP {"unitId":8,"x":4678,"y":6100,"unitLife":128}
d2gsToServer : D2GS_TOWNFOLK {"unk1":1,"unk2":8,"unk3":4677,"unk4":6099}
d2gsToServer : D2GS_INTERACTWITHENTITY {"entityType":1,"entityId":8}
d2gsToClient :  D2GS_NPCINFO {"unitType":1,"unitId":8,"unknown":[4,0,2,0,73,0,2,0,89,0,2,0,157,0,2,0,137,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
d2gsToClient :  D2GS_GAMEQUESTINFO {"unknown":[0,0,0,0,0,0,0,0,0,160,0,0,0,128,0,0,0,32,0,0,0,0,0,160,0,160,0,128,0,128,0,0,0,0,0,0,0,128,0,0,0,0,0,160,0,160,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,128,0,0,0,0,0,0,0,128,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
d2gsToClient :  D2GS_QUESTINFO {"unknown":[1,8,0,0,0,0,1,0,12,0,8,0,8,0,25,144,20,0,25,16,1,0,1,0,0,0,1,16,5,16,129,17,5,16,37,16,1,0,0,0,0,0,1,16,0,0,0,0,9,16,1,18,1,0,0,0,4,0,1,16,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,33,16,0,0,8,0,0,0,9,16,85,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}

### Identify item

>d2gsToServer : D2GS_USEITEM {"itemId":163,"x":4679,"y":6098}
d2gsToClient :  D2GS_USESTACKABLEITEM {"unknown":[0,163,0,0,0,218,0]}
d2gsToServer : D2GS_PING {"tickCount":7627312,"delay":45,"wardenResponse":0}
d2gsToClient :  D2GS_PONG {"tickCount":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
d2gsToServer : D2GS_IDENTIFYITEM {"id1":32,"id2":163}
d2gsToClient :  D2GS_UPDATEITEMSTATS {"unknown":[7]}
d2gsToClient :  D2GS_UNUSED23 {}
d2gsToClient :  D2GS_WADDEXP {"amount":113}
d2gsToClient :  D2GS_GAMELOADING {}
d2gsToClient :  D2GS_UPDATEITEMSKILL {"unknown":152,"unitId":1,"skill":218,"amount":7}
d2gsToClient :  D2GS_USESCROLL {"type":4,"itemId":163}
d2gsToClient :  D2GS_USESTACKABLEITEM {"unknown":[255,163,0,0,0,255,255]}
d2gsToClient :  D2GS_ITEMACTIONOWNED {"action":21,"category":50,"id":32 ...
d2gsToClient :  D2GS_RELATOR1 {"param1":0,"unityId":1,"param2":0}
d2gsToClient :  D2GS_RELATOR2 {"param1":0,"unityId":1,"param2":0}
d2gsToClient :  D2GS_PLAYSOUND {"unitType":0,"unitId":1,"sound":6}
      

### Repair 


**When doing repair all**

>d2gsToServer : D2GS_REPAIR {"id1":8,"id2":0,"id3":0,"id4":2147483648}
d2gsToClient :  D2GS_NPCSTOP {"unitId":6,"x":4682,"y":6155,"unitLife":128}
d2gsToClient :  D2GS_UPDATEITEMSTATS {"unknown":[7]}
d2gsToClient :  D2GS_MERCFORHIRE {"mercId":49442,"unknown":0} // <= TODO: wtf is mercforhire doing here when trading someone who repair ?

**After receiving tons of GAMELOADING**

d2gsToClient :  D2GS_NPCTRANSACTION {"tradeType":1,"result":2,"unknown":155876362,"merchandiseId":4294967295,"goldInInventory":0}

**TODO: is merchandiseId correct ? whats unknown ? (result 2 seems to be successful transaction)**

d2gsToClient :  D2GS_SETDWORDATTR {"attribute":15,"amount":346339} // TODO: what is saying ?



**When doing repair 1 item (weapon in that case)**
>d2gsToServer : D2GS_REPAIR {"id1":8,"id2":25,"id3":0,"id4":13}
d2gsToClient :  D2GS_UPDATEITEMSTATS {"unknown":[7]}
d2gsToClient :  D2GS_UNUSED8 {}
d2gsToClient :  D2GS_NPCTRANSACTION {"tradeType":1,"result":2,"unknown":155876362,"merchandiseId":4294967295,"goldInInventory":0}
d2gsToClient :  D2GS_SETDWORDATTR {"attribute":15,"amount":346204}


### When leaving a game

>d2gsToServer : D2GS_GAMEEXIT {}
d2gsToClient :  D2GS_NPCSTOP {"unitId":9,"x":5758,"y":4541,"unitLife":128}
d2gsToClient :  D2GS_GAMECONNECTIONTERMINATED {}
d2gsToClient :  D2GS_UNLOADCOMPLETE {}
d2gsToClient :  D2GS_GAMEEXITSUCCESSFUL {}
sidToServer : SID_LOGONREALMEX {"clientToken":9,"hashedRealmPassword":{"type":"Buffer","data":[32,230,46,20,250,152,165,84,159,7,128,137,51,19,23,208,85,125,135,189]},"realmTitle":"Path of Diablo"}
sidToClient : SID_LOGONREALMEX {"MCPCookie":9,"MCPStatus":0,"MCPChunk1":[0,1656],"IP":[198,98,54,85],"port":6113,"zero":0,"MCPChunk2":[173112583,0,0,1144150096,13,0,0,4231807654,3473022855,1571197212,650787684,1325819087],"battleNetUniqueName":"Elfwallader"}
Start of mcp session
mcpToServer : Read error for size : undefined
mcpToServer : MCP_STARTUP {"MCPCookie":9,"MCPStatus":0,"MCPChunk1":[0,1656],"MCPChunk2":[173112583,0,0,1144150096,13,0,0,4231807654,3473022855,1571197212,650787684,1325819087],"battleNetUniqueName":"Elfwallader"}
mcpToClient : MCP_STARTUP {"result":0}
mcpToServer : MCP_CHARLOGON {"characterName":"xzzad"}
mcpToClient : MCP_CHARLOGON {"result":0}
sidToServer : SID_GETCHANNELLIST {"productId":1144150096}
sidToServer : SID_ENTERCHAT {"characterName":"xzzad","realm":"Path of Diablo,xzzad"}


### D2GS_REMOVEOBJECT
    
>received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":104}
received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":103}
received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":102}

### D2GS_WORLDOBJECT
    
>d2gsToClient :  D2GS_WORLDOBJECT {"objectType":2,"objectId":10,"objectUniqueCode":119,"x":4419,"y":5609,"state":2,
"interactionCondition":0}
    
### D2GS_UPDATEITEMSKILL
**when buying id scroll**

>D2GS_UPDATEITEMSKILL {"unknown":152,"unitId":1,"skill":218,"amount":8}

### D2GS_USESCROLL
**use scroll of portal (using skill 220)**

received compressed packet D2GS_USESCROLL {"type":4,"itemId":225}
