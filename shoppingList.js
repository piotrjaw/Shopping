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
            document.getElementById("temp-ul").style.display = "block";
            document.getElementsByClassName("old-item-quantity").text.value = "";
            document.getElementById("listclickinput").style.display = "none";
        },

        'submit .new-item': function(event) {
            var nitem = event.target.item.value;
            if(nitem.length > 0) {
                Session.set("nitem", nitem);
                document.getElementById("newinput").style.display = "block";
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

                Meteor.call("addItem", insertData);

                document.getElementById("newinput").style.display = "none";
                event.target.unit.value = "";
                event.target.quantity.value = "";
                event.target.ratio.value = "";
                event.target.tak.selected = false;
                event.target.nie.selected = false;
            } else {
                alert("Nie podano jednostki.");
            }
            return false;
        },

        'click #nie': function () {
            document.getElementById("ratio").style.display = "block";
        },

        'click #tak': function () {
            document.getElementById("ratio").style.display = "none";
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
            document.getElementById("listclickinput").style.display = "block";
            document.getElementById("temp-ul").style.display = "none";
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
            Meteor.call("addItem", insertData);

            event.target.text.value = "";

            document.getElementById('#iteminput').item.value = "";

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
            if(password == "merkava") {
                MainItems.remove({});
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