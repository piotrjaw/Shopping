MainItems = new Mongo.Collection("items");
TempItems = new Mongo.Collection("titems");
SpanItems = new Mongo.Collection("sitems");

if (Meteor.isClient) {

    Meteor.subscribe("pub_items");
    Meteor.subscribe("pub_titems");
    Meteor.subscribe("pub_sitems");

    Template.body.helpers({
        items: function() {
            return MainItems.find({});
        },

        tempitems: function() {
            var lite = Session.get("lite");
            if(lite != ""){
                var uitemsC = MainItems.find({ "item" : { '$regex': lite, '$options':"i"}}).fetch();
                for (var i = 0; i < uitemsC.length; i++) {
                    delete uitemsC[i]._id;
                    delete uitemsC[i].quantity;
                }
                Meteor.call("reactiveItems", uitemsC);
                return TempItems.find({});
            } else {
                return null;
            }
        },

        spanitems: function() {
            var sitem = Session.get("sitem");
            var sunit = Session.get("sunit");
            Meteor.call("spanReactiveItems", sitem, sunit);
            return SpanItems.find({});
        },

        nitem: function() {
            var nitem = Session.get("nitem");
            return nitem;
        }
    });

    Template.newItem.events({
        'keypress input#iteminput, keyup input#iteminput, change input#iteminput': function (event) {
            var l = event.target.value;
            Session.set("lite", l);
//            document.getElementById("temp-ul").style.display = "block";
            $("#temp-ul").slideDown("fast");
            document.getElementsByClassName("old-item-quantity").text.value = "";
//            document.getElementById("listclickinput").style.display = "none";
            $("#listclickinput").slideUp("fast");
        },

        'submit .new-item': function(event) {
            var nitem = event.target.item.value;
            if(nitem.length > 0) {
                Session.set("nitem", nitem);
//                document.getElementById("newinput").style.display = "block";
                $("#newinput").slideDown("fast");
                $("#temp-ul").slideUp("fast");
                event.target.item.value = "";
            } else {
                alert("Nie podano produktu.");
            }
            return false;
        }

    });

    Template.addNewItem.events({

        'submit .add-new-item': function (event) {
            event.preventDefault();
            var unit = event.target.unit.value;
            if (unit.length > 0) {
                var mainUnit = event.target.mainUnit.value;
                var toMainUnit;
                if (mainUnit == 1) {
                    toMainUnit = 1;
                } else {
                    toMainUnit = event.target.ratio.value;
                }
                var ownerId = Meteor.userId();
                var insertData = {
                    item: Session.get('nitem'),
                    unit: unit,
                    quantity: event.target.quantity.value,
                    mainUnit: mainUnit,
                    toMainUnit: toMainUnit,
                    invisible: false,
                    checked: false,
                    owner: ownerId,
                    createdAt: new Date()
                };

                event.target.unit.value = "";
                event.target.quantity.value = "";
                event.target.ratio.value = "";
                $('#tak').prop("checked", false);
                $('#nie').prop("checked", false);
//                document.getElementById("newinput").style.display = "none";
                $('#newinput').slideUp("fast");

                Meteor.call("addItem", insertData);

            } else {
                alert("Nie podano jednostki.");
            }
            return false;
        },

        'click #nie': function () {
//            document.getElementById("ratio").style.display = "block";
            $("#ratio").slideDown("fast");
        },

        'click #tak': function () {
//            document.getElementById("ratio").style.display = "none";
            $("#ratio").slideUp("fast");
        }
    });

    Template.erase.events({

        'submit .erase': function() {
            Meteor.call("nuke");
            return false;
        }

    });

    Template.tempitem.events({
        'click .tempitem': function (event) {
            var sitem = event.target.children[0].innerText;
            var sunit = event.target.children[1].innerText;
            Session.set("sitem", sitem);
            Session.set("sunit", sunit);
//            document.getElementById("listclickinput").style.display = "block";
            $("#listclickinput").slideDown("fast");
//            document.getElementById("temp-ul").style.display = "none";
            $("#temp-ul").slideUp("fast");
        }
    });

    Template.tsitem.events({
        'submit .old-item-form': function (event) {
            event.preventDefault();
            var q = event.target.text.value.replace(",", ".");
            var sit = Session.get("sitem");
            var sun = Session.get("sunit");
            var mu = MainItems.findOne({item: sit, unit: sun}).mainUnit;
            var tmu = MainItems.findOne({item: sit, unit: sun}).toMainUnit;
            var ownerId = Meteor.userId();
            var insertData = {
                item: sit,
                quantity: q,
                unit: sun,
                mainUnit: mu,
                toMainUnit: tmu,
                invisible: false,
                checked: false,
                owner: ownerId,
                createdAt: new Date()
            };

            event.target.text.value = "";
            $('#iteminput').val('');
//            document.getElementById("listclickinput").style.display = "none";
            $("#listclickinput").slideUp("fast");

            Meteor.call("addItem", insertData);

            return false;
        }
    });

    Template.item.events({
        'click .toggle-checked': function() {
            Meteor.call("setChecked", this._id, ! this.checked);
        },

        'click .delete': function () {
            Meteor.call("deleteItem", this._id);
        }
    });

    Template.body.events({
       'click h1': function() {
           $("#temp-ul").slideUp("fast");
           $("#listclickinput").slideUp("fast");
           $("#ratio").slideUp("fast").val("");
           $("#newinput").slideUp("fast");
           $("#tak").prop("checked", false);
           $("#nie").prop("checked", false);
           $("#unit").val("");
           $("#quantity").val("");
           $("#iteminput").val("");
       },

       'click #stats-btn':function() {
           if($("#content").is(":visible")) {
               $("#content").slideUp(200, function() {
                   $("#stats").slideDown(200);
               });
           } else {
               $("#stats").slideUp(200, function() {
                   $("#content").slideDown(200);
               });
           }

       }
    });

    Accounts.ui.config({
        passwordSignupFields: 'USERNAME_ONLY'
    });
}

if (Meteor.isServer) {

    Meteor.methods({
        reactiveItems: function (uitems) {
            TempItems.remove({});
            for (var i = 0; i < uitems.length; ++i) {
                var check = 0;
                for (var j = 0; j < i; ++j) {
                    if (uitems[i].item == uitems[j].item && uitems[i].unit == uitems[j].unit) {
                        check = 1;
                    }
                }
                if (check == 0) {
                    TempItems.insert(uitems[i]);
                }
            }
        },

        spanReactiveItems: function (sitem, sunit) {
            SpanItems.remove({});
            SpanItems.insert({item: sitem, unit: sunit});
        },

        addItem: function (insertData) {
            MainItems.insert(insertData);
        },

        nuke: function () {
            MainItems.update({ owner: Meteor.userId(), invisible: false }, { $set: {invisible: true} }, { multi: true });
        },

        setChecked: function(itemId, setChecked) {
            MainItems.update(itemId, {$set: {checked : setChecked}});
        },

        deleteItem: function(itemId) {
            MainItems.update(itemId, {$set: {invisible : true}});
        },

        nukeAll: function (password) {
            if(Package.sha.SHA256(password) == "cb37de38abbd2567895e2b53166af4109252034ccc9902399c119477dfd75b3c") {
                MainItems.remove({});
            } else {
                alert("Password incorrect!");
            }
        },

        nukeMine: function (password) {
            if(Package.sha.SHA256(password) == "cb37de38abbd2567895e2b53166af4109252034ccc9902399c119477dfd75b3c") {
                MainItems.remove({ owner: Meteor.userId() });
            } else {
                alert("Password incorrect!");
            }
        },

        showAll: function (password) {
            if(Package.sha.SHA256(password) == "cb37de38abbd2567895e2b53166af4109252034ccc9902399c119477dfd75b3c") {
                return MainItems.find({});
            } else {
                alert("Password incorrect!");
            }
        }
    });

    Meteor.publish("pub_items", function () {
        return MainItems.find({ owner: this.userId });
    });

    Meteor.publish("pub_titems", function () {
        return TempItems.find({ owner: this.userId });
    });

    Meteor.publish("pub_sitems", function () {
        return SpanItems.find();
    })/*;

    Accounts.validateNewUser(function (user) {
        return false;
    })*/
}