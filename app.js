//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://kumarkrish07022002:EarzakB3Mgc7x7lN@cluster0.w7p1f.mongodb.net/todolistDB");

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your To-Do-List!"
});

const item2 = new Item({
  name: "Hit '+' button to add a new item."
});

const item3 = new Item({
  name: "Check the Box, to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({}).sort({ _id: 1 });
    
    if (foundItems.length === 0) {
      await Item.deleteMany({}); // Clear existing items
      await Item.insertMany(defaultItems); // Insert fresh default items
      console.log("Successfully reset default items in DB.");
      res.redirect("/"); // Redirect to display the default items
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
  }
});

  app.get("/:customListName", async function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
  
    try {
      const foundList = await List.findOne({ name: customListName });
  
      if (!foundList) {
        // If the list doesn't exist, create a new one
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        await list.save();
        res.redirect("/" + customListName); // Redirect to display the new list
      } else {
        // If the list exists, render it
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    } catch (err) {
      console.log(err);
    }
  });


  app.post("/", async function (req, res) {
    const itemName = req.body.newItem; // Name of the new item
    const listName = req.body.list;   // Name of the list (Today, Work, etc.)
  
    const item = new Item({
      name: itemName
    });
  
    try {
      if (listName === "Today") {
        await item.save(); // Save item to the default "Today" list
        res.redirect("/");
      } else {
        // Find the custom list and add the item
        const foundList = await List.findOne({ name: listName });
        if (foundList) {
          foundList.items.push(item); // Add the item to the items array
          await foundList.save();
          res.redirect("/" + listName);
        } else {
          console.log("List not found!");
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
  
  

  app.post("/delete", async function (req, res) {
    const checkItemId = req.body.checkbox; // ID of the item to be deleted
    const listName = req.body.listName;   // Name of the list (Today, Work, etc.)
  
    if (listName === "Today") {
      try {
        await Item.findByIdAndDelete(checkItemId); // Delete the item from the "Today" collection
        console.log("Successfully deleted checked item from Today.");
        res.redirect("/");
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        // Find the custom list and remove the item from its items array
        await List.findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkItemId } } } // Pull the item with the given ID
        );
        console.log(`Successfully deleted item from ${listName} list.`);
        res.redirect("/" + listName);
      } catch (err) {
        console.log(err);
      }
    }
  });
  


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(PORT, function() {
  console.log("Server started on port 3000");
});
