Items = new Mongo.Collection("items");
TempItems = new Mongo.Collection("titems");
SpanItems = new Mongo.Collection("sitems");

if (Meteor.isClient) {
    Template.body.helpers({
        items: function() {
            return Items.find({});
        },

        tempitems: function() {
            var lite = Session.get("lite");
            if(lite != ""){
                var uitemsC = Items.find({ "item" : { '$regex': lite, '$options':"i"}}).fetch();
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

    Template.body.events({
        'keypress input#iteminput, keyup input#iteminput, change input#iteminput': function(event) {
            var l = event.target.value;
            Session.set("lite", l);
            document.getElementById("listclickinput").style.display = "none";
            document.getElementsByClassName("new-item-quantity").text.value = "";
        },

        'click .tempitem': function(event) {
            var sitem = event.target.parentNode.childNodes[1].innerText;
            var sunit = event.target.parentNode.childNodes[3].innerText;
            Session.set("sitem", sitem);
            Session.set("sunit", sunit);
            document.getElementById("listclickinput").style.display = "block";
        },

        'submit .new-item-quantity': function(event) {
            var q = event.target.text.value.replace(",", ".");
            var sit = Session.get("sitem");
            var sun = Session.get("sunit");
            var mu = Items.findOne({ item: sit, unit: sun}).mainUnit;
            var tmu = Items.findOne({ item: sit, unit: sun}).toMainUnit;
            Items.insert({
                item: sit,
                quantity: q,
                unit: sun,
                mainUnit: mu,
                toMainUnit: tmu,
                createdAt: new Date()
            });

            event.target.text.value = "";

            document.getElementById('#iteminput').item.value = "";

            return false;
        },

        'submit .new-item': function(event) {
            var nitem = event.target.item.value;
            Session.set("nitem", nitem);
            document.getElementById("newinput").style.display = "block";
            event.target.item.value = "";

            return false;
        },

        'submit .add-new-item': function(event) {
            var mainUnit = event.target.mainUnit.value;
            var toMainUnit;
            if(mainUnit == 1) {
                toMainUnit = 1;
            } else {
                toMainUnit = event.target.ratio.value;
            }
            var insertData = {
                item: Session.get('nitem'),
                unit: event.target.unit.value,
                quantity: event.target.quantity.value,
                mainUnit: mainUnit,
                toMainUnit: toMainUnit,
                createdAt: new Date()
            };

            Meteor.call("addItem", insertData);

            document.getElementById("newinput").style.display = "none";

            return false;
        },

        'click #nie': function() {
            document.getElementById("ratio").style.display = "block";
        },

        'click #tak': function() {
            document.getElementById("ratio").style.display = "none";
        },

        'submit .erase': function() {
            Meteor.call("nuke");
        }
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
            Items.insert(insertData);
        },

        nuke: function () {
            Items.remove({});
        }
    })
}