"use strict";
   
    // Initialize everything when the window finishes loading
    window.addEventListener("load", function(event) {
      StellarSdk.Network.useTestNet();

      var network_testnet = {};
      var message = document.getElementById("message");
      var account = document.getElementById("account");
      var seed = {};
      var url = {};
      var port = {};
      var secure = {};
      var current_mode = {};
    
      var network = {};
         
      
      var paymentsEventSource;
      var server;
      var key;
      
      var server_mode = "horizon";
      var fed_mode_forward = true;
      
   
     
     

      var env_b64 = window.location.href.match(/\?env_b64=(.*)/);
      var encrypted_seed = window.location.href.match(/\?seed=(.*)/);
      var accountID = window.location.href.match(/\?accountID=(.*)/);
      var json_param = window.location.href.match(/\?json=(.*)/);
      if (env_b64 !== null) {
        console.log(env_b64[1]);
      }
      if (json_param != null) {
        //escape(str)
        console.log("json_param detected");
        json_param = unescape(json_param[1]);
        var params = JSON.parse(json_param);
        console.log(params);
        console.log(params["accountID"]);
        console.log(params["env_b64"]);
        account.value = params["accountID"];
        if (typeof params["env_b64"] != "undefined") {
          console.log("env_b64 param detected");
          envelope_b64.value = params["env_b64"];
          account.value = new StellarSdk.Transaction(envelope_b64.value).operations[0].destination;
          console.log(new StellarSdk.Transaction(envelope_b64.value).operations[0].asset);
          tissuer.value = new StellarSdk.Transaction(envelope_b64.value).operations[0].asset.issuer;
          tasset.value = new StellarSdk.Transaction(envelope_b64.value).operations[0].asset.code;
          asset_type.value = tasset.value;
          submitTransaction_horizon_b64(envelope_b64.value);
        }               
        if (typeof params["seed"] != "undefined") {
          seed.value = params["seed"];
        }
        if (typeof params["amount"] != "undefined") {
          amount.value = params["amount"];
        }
        if (typeof params["memo"] != "undefined") {
          memo.value = params["memo"];
        }
        if (typeof params["asset"] != "undefined") {
          asset.value = params["asset"];
        }
        if (typeof params["issuer"] != "undefined") {
          issuer.value = params["issuer"];
        }
        if (typeof params["destination"] != "undefined") {
          destination.value = params["destination"];
        }
      } 
      if (encrypted_seed != null) {
        console.log(encrypted_seed[1]);
        seed.value = encrypted_seed[1];
        update_key();      
      }    
      if (accountID != null) {
        console.log("here?");
        console.log(accountID[1]);
        account.value = accountID[1];
      }

      //merge_accounts.disabled = true;
      network.value ="testnet";
      console.log("just after var");
     // status.textContent = "Not Connected";
      url.value = "horizon-testnet.stellar.org";
      port.value = "443";
      secure.value = "true";
      
                                 
      reset_horizon_server();

      current_mode.value = "Stellar horizon TestNet";
      //account.value = "GA22BQDQZNWZZLBO2WRQKJGU5VBR6EUZMKJMVGLQGZGVJYQ4JQ4X7U4T";
      account.value = 'GAZZRNFURXYWKIEFOS35U7UJEM6IHARGDOL6PNESIXOI7OCVX6YTMKM4';
      //account.value = 'GAMCHGO4ECUREZPKVUCQZ3NRBZMK6ESEQVHPRZ36JLUZNEH56TMKQXEB';

      if (account.value.length > 0) {
        console.log("account value: " + account.value);
        console.log(typeof account.value);
      } else { 
        console.log("use seed value"); 
        key = StellarSdk.Keypair.fromSeed(seed.value);
        update_key();
      }      
    
      account.value = 'GAMCHGO4ECUREZPKVUCQZ3NRBZMK6ESEQVHPRZ36JLUZNEH56TMKQXEB';
     
      //update_balances();
      //start_effects_stream()
      
      var xmlhttp = new XMLHttpRequest();

var streamingMessageHandler = function (record) {
    console.log(record);
};

//.order({"asc" or "desc"})


function get_transactions_desc(bal) {
  console.log("start get_transactions_desc");
  var es = server.transactions()
    .forAccount(account.value)    
    .order("desc")
    .call()
    .then(function (page) {
        console.log("page");
        console.log(page);
        console.log("start balance");
        console.log(bal);
        //var bal = {};
        bal.create_detected = true;
        //console.log(page.records);
        var arrayLength = page.records.length;
        for (var i = 0; i < arrayLength; i++) {
          //console.log(page.records[i]._links.transaction.href);                 
          var b64 = page.records[i].envelope_xdr;
          var tx = new StellarSdk.Transaction(b64);          
          //page.records[i].tx = tx;          
          page.records[i].memo_type = tx.memo._arm;
          page.records[i].memo_value = tx.memo._value;
          //page.records[i].from = tx.operations[0].source;
          page.records[i].from = page.records[i].source_account;
          page.records[i].amount = tx.operations[0].amount;
          page.records[i].startingBalance = tx.operations[0].startingBalance;
          page.records[i].type = tx.operations[0].type;
          page.records[i].to = tx.operations[0].destination;
          page.records[i].timeBounds = tx.tx.timeBounds;
          page.records[i].asset = tx.operations[0].asset;
          page.records[i].asset_code = "XLM";
          if (typeof page.records[i].asset != "undefined") {
            page.records[i].issuer = tx.operations[0].asset.issuer;
            page.records[i].asset_code = tx.operations[0].asset.code;
          }
          if (page.records[i].type == "payment") {
            console.log("payment");
            if (bal.create_detected == true) {
              if (account.value != page.records[i].to) {
                amount = amount * -1;
              }  
              var amount = parseFloat(page.records[i].amount);
              if (page.records[i].asset == "XLM") {
                console.log("asset is XLM");                            
                bal.native = parseFloat(bal.native) + amount;                
                bal.asset[0]["asset_code"] = "XLM";
                bal.asset[0]["balance"] = bal.native;                
                page.records[i].bal = clone(bal);
                page.records[i].trans_asset_bal = page.records[i].bal.native - 0.0001;
              } else {
                console.log("asset not XLM");
                var asset_not_found = true;
                var blen = bal.asset.length;
                for (var a = 0; a < blen; a++) {                  
                  if (bal.asset[a]["asset_code"] == page.records[i].asset_code && bal.asset[a]["issuer"] == page.records[i].issuer){                                 
                    bal.asset[a]["balance"] =  bal.asset[a]["balance"] + amount;
                    page.records[i].bal = clone(bal);
                    page.records[i].trans_asset_bal = bal.asset[a]["balance"] + amount;
                    asset_not_found = false;
                  }
                }
                if (asset_not_found) {
                  console.log("asset_not_found add new: " + page.records[i].asset_code);                                 
                  bal.asset[blen] = {};
                  bal.asset[blen]["asset_code"] = page.records[i].asset_code;
                  bal.asset[blen]["issuer"] = page.records[i].issuer;
                  bal.asset[blen]["balance"] = amount;                  
                  page.records[i].bal = clone(bal);
                  page.records[i].trans_asset_bal = page.records[i].bal.asset["balance"];
                }
              }
            }            
          }
          if (page.records[i].type == "createAccount") {
            console.log("createAccount2");
            console.log(bal);
            console.log(page.records[i].to);
            console.log(account.value);
            if (page.records[i].to == account.value) {
              bal.create_detected = true;
              bal.native = parseFloat(page.records[i].startingBalance);
              bal.asset = [];
              bal.asset[0] = {};
              bal.asset[0]["asset_code"] = "XLM"
              bal.asset[0]["balance"] = bal.native;
            } else {
              console.log("createaccount to diff dest");
              bal.native = bal.native - parseFloat(page.records[i].startingBalance) - 0.0001;
              bal.asset[0]["balance"] = bal.native;
            }
            page.records[i].bal = clone(bal);
            page.records[i].trans_asset_bal = page.records[i].bal.native ;
            console.log(bal);           
          }
          // all transaction still pay .0001 Lumens so account for that here
          if (page.records[i].type != "payment" && page.records[i].type != "createAccount"){
            console.log("trans not pay or create");
            bal.native =  bal.native - 0.0001;
            bal.asset[0]["asset_code"] = "XLM";
            bal.asset[0]["balance"] =  bal.native - 0.0001;
            page.records[i].bal = clone(bal);
          }                               
        }  
        console.log(page.records);
        display_history(page.records);
    });
}

var present_balance = {};
present_balance.asset = [];
present_balance.asset[0] = {};
present_balance.asset[1] = {};
present_balance.asset[0]["asset_code"] = "XLM";
present_balance.asset[0]["balance"] = 9322.0895094;
present_balance.asset[1]["asset_code"] = "EQD";
present_balance.asset[1]["balance"] = 999881.7700000;
present_balance.native = 9322.0895094
present_balance = {};
present_balance.asset = [];
get_transactions_desc(present_balance);




function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
}

function display_history(page){
  console.log("start display_history");
  console.log(page[0]);
  var len = page.length;
  for (var i = len - 1; i >= 0; i--) { 
    //console.log(page[i]);
    console.log("i: " + i);
    console.log(page[i].type);
    if (page[i].type == "payment") {
      console.log(page[i].created_at);
      console.log(page[i].from);
      console.log(page[i].to);
      console.log(page[i].amount);
      console.log(page[i].asset_code);
      console.log(page[i].memo);
      //console.log(page[i].trans_asset_bal);
      page[i].from = page[i].from.substring(0, 6);
      display_stream(page[i]);      
    }    
  }
}

function display_stream(object){
  object.from = object.from.substring(0, 6);
  if (object.to == account.value){
        object.to = object.to.substring(0, 6);
        message.innerHTML =  "<br />" + '<font color="#00ff00">credit from: ' + object.from + " amount: " + object.amount + " ("+ object.asset_code +") memo: "+ object.memo + " dt: " + object.created_at + "</font> "+ message.innerHTML;
      } else {
        object.to = object.to.substring(0, 6);
        message.innerHTML = "<br />" + '<font color="#ff0000">debit to: ' + object.to + " amount: "  + object.amount + " ("+ object.asset_code +") memo: "+ object.memo +  " dt: " + object.created_at + "</font> " + message.innerHTML;
      } 
}

var future_payments = server.payments()
  .forAccount(account.value)
  .cursor("now")
  .stream({onmessage: handlePaymentResponse});



 // Listen for payments from where you last stopped
// GET https://horizon-testnet.stellar.org/accounts/{config.hotWallet}/payments?cursor={last_token}
var record_log = {};    
function handlePaymentResponse(record) {
   console.log("future_payments");
   console.log(future_payments);      
   //console.log(record);
   if (record.type != "payment") {
     return;
   }
   var start_index = record._links.transaction.href.indexOf("transactions/");
   var tx_id = record._links.transaction.href.substring(start_index+13);
   // tx_id: 51d52586b253c9ee96fc4f555b9ec772ecbd6cc1b4f992fcf7161942135a8059
   var tx_id_short = tx_id.substring(50);
   console.log("tx_id_short: " + tx_id_short);
   record.tx_id = tx_id;
   record.tx_id_short = tx_id_short;
   record_log[tx_id_short] = record;
      
   record.transaction(record)
    .then(function(txn) {
      var tx_id_short = txn.id.substring(50);           
      console.log(" memo: " + txn.memo); 
      console.log(" create_at: " + txn.created_at);
      console.log(" tx_id_short: " + tx_id_short);
      console.log(record_log[tx_id_short]);
      if (record_log[tx_id_short].asset_type == "native"){
        record_log[tx_id_short].asset_code = "XLM";
      }
      record_log[tx_id_short].memo = txn.memo;
      record_log[tx_id_short].created_at = txn.created_at;     
      display_stream(record_log[tx_id_short]); 
      delete record_log[tx_id_short];
       
     //console.log(" txn: ");
     //console.log(txn);
   });
}

    
      xmlhttp.onreadystatechange = function() {
              console.log("onreadystatechange");
              console.log("readystate: " + xmlhttp.readyState + " xmlhttp.status: " + xmlhttp.status);
              if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                console.log("responseText: " + xmlhttp.responseText);
                var myArr = JSON.parse(xmlhttp.responseText);
                console.log("xmlhttp response");                
                console.log(myArr);
                console.log(myArr.account_id);
                if (fed_mode_forward) {
                  account.value = myArr.account_id;
                } else {
                  account.value = myArr.stellar_address;
                }
              }
      };

         

          function federation_lookup(){
            fed_mode_forward = true;
            console.log("federation_lookup click detected");
            //http://zipperhead.ddns.net:8000/federation?q=sacarlson*zipperhead.ddns.net&type=name'
            //var url = "http://zipperhead.ddns.net:8000/federation?q=" + account.value + "*zipperhead.ddns.net&type=name";
            var url = "http://";
            // sacarlson*zipperhead.ddns.net:8000
            account.value = account.value.replace("@", "*");
            var start_index = account.value.indexOf("*");
            url = url + account.value.substring(start_index+1);
            console.log("url: " + url);
            url = url + "/federation?q=" + account.value + "&type=name";
            console.log("url+: " + url);
            //var url = "http://zipperhead.ddns.net/text.txt";
            //var url = "http://poker.surething.biz/files/test.php";
            //var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", url, true);
            //xmlhttp.withCredential = "true";
            xmlhttp.send();            
          }

          function reverse_federation_lookup(){
            fed_mode_forward = false;
            console.log("reverse_federation_lookup click detected");
            console.log(account_obj_global);
            if (typeof account_obj_global.home_domain == "undefined") {
              console.log("no home_domain");
            } else {
              var url = "http://" + account_obj_global.home_domain + "/federation?q=" + account.value +"&type=id";
              console.log("url: " + url);
              xmlhttp.open("GET", url, true);
              xmlhttp.send();
            }            
          }

                   
          function attachToPaymentsStream(opt_startFrom) {
            console.log("start attacheToPaymentsStream");
            var futurePayments = server.effects().forAccount(account.value);
            if (opt_startFrom) {
                console.log("opt_startFrom detected");
                futurePayments = futurePayments.cursor(opt_startFrom);
            }
            if (paymentsEventSource) {
                console.log('close open effects stream');
                paymentsEventSource.close();
            }
            console.log('open effects stream with cursor: ' + opt_startFrom);
            paymentsEventSource = futurePayments.stream({
                onmessage: function (effect) { effectHandler(effect, true); }
            });
          };

          function start_effects_stream() {
	    server.effects()
            .forAccount(account.value)
            .limit(30)
            .order('desc')
            .call()
            .then(function (effectResults) {
                console.log("then effectResults");
                var length = effectResults.records ? effectResults.records.length : 0;
                for (index = length-1; index >= 0; index--) {
                    console.log("index" + index);
                    var currentEffect = effectResults.records[index];
                    effectHandler(currentEffect, false);
                }
                var startListeningFrom;
                if (length > 0) {
                    latestPayment = effectResults.records[0];
                    startListeningFrom = latestPayment.paging_token;
                }
                attachToPaymentsStream(startListeningFrom);
            })
            .catch(function (err) {
                //console.log(err);
                console.log("error detected in attachToPaymentsStream");
                attachToPaymentsStream('now');               
            });
          }

          function effectHandler(effect,tf) {
            console.log("got effectHandler event");
            console.log(tf);
            console.log(effect);
            if (effect.type === 'account_debited') {
               if (effect.asset_type === "native") {
                  balance.value = balance.value - effect.amount;
               }else {
                  CHP_balance.value = CHP_balance.value - effect.amount;
               }
            }
            if (effect.type === 'account_credited') {
               if (effect.asset_type === "native") {
                  balance.value = balance.value + effect.amount;
               }else {
                  CHP_balance.value = CHP_balance.value + effect.amount;
               }
            }
            if (effect.type === 'account_created') {
               balance.value = effect.starting_balance;
            }
          };

      function reset_horizon_server() {
        console.log("reset_horizon_server"); 
        console.log("secure: " + secure.value);
        var tf = true;
        if (secure.value == "false") { 
          tf = false;
        }  
        server = new StellarSdk.Server({     
          hostname: url.value,
          port: Number(port.value),
          secure: tf
        });
      }
       
      function get_account_info(account,params,callback) {
        if (server_mode === "mss_server") {
          socket_open_flag = true;
        }else {
          console.log("get_account_info horizon mode");
          server.accounts()
          .address(account)
          .call()
          .then(function (accountResult) {
            callback(accountResult,params);                    
          })
          .catch(function (err) {
            console.log("got error in get_account_info");
            console.error(err);
            callback(err,params);          
          })
        }
      }

      function display_message(param) {
        message.textContent = JSON.stringify(param);
      }

       function update_balances_set(account_obj,params) {
        console.log("params: " + params.asset_code1 + " 2" + params.asset_code2);
        console.log("account_obj");
        console.log(account_obj.balances[0].balance);
        if (account_obj.name != "NotFoundError"){
          console.log("we have funding");
          console.log(account_obj.balances);
          if (account_obj.balances.length == 1) {
            console.log("length ok");            
            console.log(account_obj.balances[0].asset_type);
            console.log(account_obj.balances[0].balance);
            if (account_obj.balances[0].asset_type == "native" && account_obj.balances[0].balance > 30.1){
              console.log("add auto trustline here");
              var operation = addTrustlineOperation(asset_type.value, issuer.value);
              createTransaction(key,operation);
            }              
          }
        }
        console.log(account_obj);

        account_obj_global = account_obj;     
        display_balance(account_obj,{to_id:params.to_id1,
          asset_code:params.asset_code1,
          detail:false}
        );   
        if (params.asset_code2 == "XLM" || params.asset_code2 == "native"){
          console.log("was XLM");
          //account_obj.balances.xlm = balance.value;
          //params.asset_code2 = "native";
        } else {
          display_balance(account_obj,{
            to_id:params.to_id2,
            asset_code:params.asset_code2,
            detail:params.detail}
          );
        }
      }

      function display_balance(account_obj,params) { 
          console.log("account_obj2");
          console.log(account_obj); 
          console.log("asset_code: " + params.asset_code);        
          var balance = 0;
          console.log("display_balance account_obj");
          console.log(account_obj);
          console.log(account_obj.name);
          if (account_obj.name !== "NotFoundError"){
            account_obj.balances.forEach(function(entry) {
              if (entry.asset_code == params.asset_code) {
                balance = entry.balance;
              }                          
            });
          }
          window[params.to_id].value = balance;
          if (params.detail == true) {
            display_message(account_obj);
          }
          return account_obj;          
        }

      
       function get_balance(account,to_id,asset) {         
         get_account_info(account,{to_id:to_id,asset:asset},display_balance)
       } 
     
      function update_key() {
        key = StellarSdk.Keypair.fromSeed(seed.value);
        account.value = key.address();
      }
      
     

      function update_balances() {
        update_key();
        if (server_mode === "mss_server"){
          console.log("update_balances mss mode");
          get_balance_updates_mss();
          return
        }
       
        get_account_info(account.value,{
          to_id1:"balance",
          asset_code1:null,
          to_id2:"CHP_balance",
          asset_code2:asset_type.value,
          detail:true},update_balances_set);       
      }

      
      function createAccount(key) {
          console.log("start createAccount");
          var operation = createAccountOperation();
          createTransaction(key,operation);
        }

      function sendPaymentTransaction() {
        console.log("sendPaymentTransaction");
        var key = StellarSdk.Keypair.fromSeed(seed.value);
        if (asset.value== "native") {
          var asset_obj = new StellarSdk.Asset.native();
          if (dest_balance.value == 0){
            if (amount.value < 20) {
              message.textContent = "destination account not active must send min 20 native";
              return;
            }
            createAccount(key);
          }else {
            createPaymentTransaction(key,asset_obj);
          }
        }else {
          if (dest_balance.value == 0){
            message.textContent = "destination account not active, can only send native";
            return;
          }
          console.log("asset: " + asset.value + " issuer: " + issuer.value);
          var asset_obj = new StellarSdk.Asset(asset.value, issuer.value);
          message.textContent = "started payment: ";
          createPaymentTransaction(key,asset_obj);
        }        
      }    
  

      function createPaymentTransaction(key,asset_obj) {
          console.log("createPaymentTransaction");
          var operation = createPaymentOperation(asset_obj);
          createTransaction(key,operation);
        }

     function accountMergeTransaction() {
          // this will send all native of key from seed.value account to destination.value account
          update_key();
          console.log("accountMerge");        
          key = StellarSdk.Keypair.fromSeed(seed.value);
          console.log(key.address());
          var operation = accountMergeOperation();
          console.log("operation created ok");
          createTransaction(key,operation);
        }

     function submitTransaction_mss(transaction) {
       console.log("start submitTransaction_mss");
       var b64 = transaction.toEnvelope().toXDR().toString("base64");
       envelope_b64.value = b64;
       if (email_flag) {
         email_funds_now();
         email_flag = false;
         return;
       }
       var action = '{"action":"send_b64", "envelope_b64":"' + b64 + '"}';
       socket.send(action);
     }

     function submitTransaction_mss_b64(b64_string) {
       var action = '{"action":"send_b64", "envelope_b64":"' + b64_string + '"}';
       socket.send(action);
     }

     function submitTransaction_horizon_b64(b64_string){
       var tx = new StellarSdk.Transaction(b64_string);
       server.submitTransaction(tx);
     }

     function get_seq(address) {
       var action = '{"action":"get_sequence", "account":"' + address + '"}'
       socket.send(action);
     }

     function createTransaction_mss_submit(operation,seq_num) {
       update_key();
       var account = new StellarSdk.Account(key.address(), seq_num);
       if (memo_mode.value == "auto") {
         if (isNaN(memo.value)) {
           var memo_tr = StellarSdk.Memo.text(memo.value);
         } else {
           var memo_tr = StellarSdk.Memo.id(memo.value);
         }
       } else if (memo_mode.value == "memo.id") {
         var memo_tr = StellarSdk.Memo.id(memo.value);
       } else {
         var memo_tr = StellarSdk.Memo.text(memo.value);
       }
       var transaction = new StellarSdk.TransactionBuilder(account,{fee:100, memo: memo_tr})            
           .addOperation(operation)          
           .addSigner(key)
           .build();
       submitTransaction_mss(transaction); 
     }

     function createTransaction_mss(key,operation) {
       operation_globle = operation;
       get_seq(key.address());
     }

    function get_balance_updates_mss() {
      // this querys balance updates from the mss-server
      // see socket.addEventListener to see how the responces from this are feed 
      // to browser display boxes
      console.log("start get_balance_updates_mss");
      if (socket.readyState === 1) {
        var action = '{"action":"get_account_info","account":"';
        var tail = '"}';
        socket.send(action + account.value + tail);
        socket.send(action + destination.value + tail);
        var action = '{"action":"get_lines_balance","account":"';
        var tail = '"}';
        socket.send(action + account.value + '", "issuer":"' + tissuer.value + '", "asset":"' + asset_type.value + tail);
        socket.send(action + destination.value + '", "issuer":"' + issuer.value + '", "asset":"' +asset.value + tail);
      }
    }
     

      function createTransaction_horizon(key,operation) {
        update_key();
        if (memo_mode.value == "auto") {
          if (isNaN(memo.value)) {
            console.log("auto memo.text");
            var memo_tr = StellarSdk.Memo.text(memo.value);
          } else {
            console.log("auto memo.id");
            var memo_tr = StellarSdk.Memo.id(memo.value);
          }
        } else if (memo_mode.value == "memo.id") {
          console.log("manual memo.id");
          var memo_tr = StellarSdk.Memo.id(memo.value);
        } else {
          console.log("manual memo.text");
          var memo_tr = StellarSdk.Memo.text(memo.value);
        }
        server.loadAccount(key.address())
          .then(function (account) {
             transaction = new StellarSdk.TransactionBuilder(account,{fee:100, memo: memo_tr})            
            .addOperation(operation)          
            .addSigner(key)
            .build();
           if ( email_flag != true ) { 
             console.log("horizon mode sending tx");                               
             server.submitTransaction(transaction); 
           }          
          })
          .then(function (transactionResult) {
            console.log(transactionResult);
            //console.log(transaction.toEnvelope().toXDR().toString("base64"));
            envelope_b64.value = transaction.toEnvelope().toXDR().toString("base64");
            if ( email_flag ) {
              console.log("horizon mode email_flag detected");  
              email_funds_now ();
              email_flag = false;
            }  
           
          })
          .catch(function (err) {
            console.log(err);
            email_flag = false; 
          });
        }
     
      function createTransaction(key,operation) {
        if (server_mode === "mss_server") {
          console.log("start mss trans");
          createTransaction_mss(key,operation);
        } else {
          createTransaction_horizon(key,operation);
        }
       
      }

      function fix7dec(string) {
        var num = Number(string).toFixed(7);
        string = num.toString();
        return string;
      }

      function createPaymentOperation(asset_obj) {
                 console.log("creatPaymentOperation");                 
                 return StellarSdk.Operation.payment({
                   destination: destination.value,
                   amount: fix7dec(amount.value),
                   asset: asset_obj
                 });
               }

      function createAccountOperation() {
                 return StellarSdk.Operation.createAccount({
                   destination: destination.value,
                   startingBalance: fix7dec(amount.value)
                 });
               }

      function accountMergeOperation() {
                 console.log(destination.value);
                 return StellarSdk.Operation.accountMerge({
                   destination: destination.value
                 });                                     
               }

      function addSignerOperation(secondAccountAddress,weight) {
                 return StellarSdk.Operation.setOptions({
                   signer: {
                     address: secondAccountAddress,
                     weight: weight
                   }
                 });
               }

      function addTrustlineOperation(asset_type, address) {
                 //asset_type examples "USD", "CHP"
                 asset = new StellarSdk.Asset(asset_type, address);
                 return StellarSdk.Operation.changeTrust({asset: asset}); 
               }

      function setOptionsOperation() {
                 var opts = {};
                 opts.inflationDest = "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
                 opts.clearFlags = 1;
                 opts.setFlags = 1;
                 opts.masterWeight = 0;
                 opts.lowThreshold = 1;
                 opts.medThreshold = 2;
                 opts.highThreshold = 3;

                 opts.signer = {
                  address: "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7",
                  weight: 1
                 };
                 opts.homeDomain = "www.example.com";
                 return StellarSdk.Operation.setOptions(opts);
               }

    
      function create_socket() {
        console.log("started create_socket");
        open.disabled = true;
        close.disabled = false;
        var url_ws = url.value + ":" + port.value;
        console.log("url_ws: " + url_ws);
        socket = new WebSocket(url_ws, "echo-protocol");

        socket.addEventListener("open", function(event) {         
          open.disabled = true;
          close.disabled = false;
          status.textContent = "Connected";
        });

        // Display messages received from the mss-server
        // and feed desired responce to browser input boxes
        socket.addEventListener("message", function(event) {
          message.textContent = "Server Says: " + event.data;
          console.log(event.data);
          var event_obj = JSON.parse(event.data);          
          console.log("event_obj.action");
          console.log(event_obj.action);
          if (event_obj.action == "get_account_info") {          
            if (event_obj.accountid == account.value) {
              balance.value = event_obj.balance;
            }
            if (event_obj.accountid == destination.value) {
              dest_balance.value = event_obj.balance;
            }
          }
          if (event_obj.action == "get_lines_balance") {
            if (event_obj.accountid == account.value) {
              CHP_balance.value = event_obj.balance;
            }
            if (event_obj.accountid == destination.value) {
              dest_CHP_balance.value = event_obj.balance;
            }            
          }
          if (event_obj.action == "get_sequence") {
            var seq_num = (event_obj.sequence).toString();
            console.log("got sequence");
            console.log(seq_num);
            createTransaction_mss_submit(operation_globle, seq_num)
          }
          if (event_obj.action == "send_b64") {
            get_balance_updates_mss();
          }
        });

        // Display any errors that occur
        socket.addEventListener("error", function(event) {
          message.textContent = "Error: " + event;
        });

        socket.addEventListener("close", function(event) {
          open.disabled = false;
          close.disabled = true;
          status.textContent = "Not Connected";
        });

        socket.onopen = function (event) {
          console.log("got onopen event");
          get_balance_updates_mss();
        };

      }
               
      
      function save_seed(seed_nick_name_, pass_phrase_, seed_ ) {
        if (typeof(Storage) !== "undefined") {
          var encrypted = CryptoJS.AES.encrypt(seed_, pass_phrase_);       
          // Store
          localStorage.setItem(seed_nick_name_, encrypted);
          //seed.value = "seed saved to local storage"        
        }else {
          message.textContent = "Sorry, your browser does not support Web Storage...";
        }
      }

      function restore_seed(seed_nick_name_, pass_phrase_) {
        if (typeof(Storage) !== "undefined") {
          // Retrieve
          var encrypted = localStorage.getItem(seed_nick_name_);
          if (encrypted != null) {
            var seed_ = CryptoJS.AES.decrypt(encrypted, pass_phrase_).toString(CryptoJS.enc.Utf8);
          } else {
            seed_ = "";
          }
          return seed_
        }else {
          message.textContent = "Sorry, your browser does not support Web Storage...";
        }     
      }

      

      function display_localstorage_keylist() {
        var result = "";
        for ( var i = 0, len = localStorage.length; i < len; ++i ) {
          //console.log(  localStorage.key( i ) );
          result = result + localStorage.key( i ) + ", ";
        }
        message.textContent = result;
      }

           
      

       update.addEventListener("click", function(event) {
        console.log("update_balance clicked");               
       // update_balances(); 
       // save_seed("seed1", "", seed.value )    
      });


  });

