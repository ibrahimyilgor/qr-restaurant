import MenuItemPhoto from "../models/MenuItemPhoto.js";
import MenuPdf from "../models/MenuPdf.js";
import Restaurant from "../models/Restaurant.js";
import RestaurantVisit from "../models/RestaurantVisit.js";
import User from "../models/User.js";
import { PLAN_IDS } from "../utils/constants.js";
import { isDesktop, isTablet, isMobile } from "react-device-detect";

/*READ BRANCHES*/

export const getBranches = async (req, res) => {
  try {
    let branches;
    branches = await Restaurant.find({ user_id: req.params.id });
    res.status(200).json(branches);
  } catch (error) {
    throw new Error("Error while getting restaurant by user id");
  }
};

/*ADD BRANCH*/

export const addBranch = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req?.body?.planId === PLAN_IDS[0] && req?.body?.restaurantsLength) {
      res.status(500).json({ error: "This plan exceeded branch limit" });
    }

    const newRestaurant = new Restaurant({
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      user_id: user._id,
    });

    user.restaurants.push(newRestaurant);
    await user.save();
    await newRestaurant.save();

    const newRestaurantVisit = new RestaurantVisit({
      restaurant_id: newRestaurant?._id,
      data: {
        year: new Date().getFullYear(),
        months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    });

    await newRestaurantVisit.save();

    return res
      .status(201)
      .json({ message: "Restaurant added to user", restaurant: newRestaurant });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/*DELETE BRANCH*/

export const deleteBranch = async (req, res) => {
  try {
    await MenuItemPhoto.deleteMany({ restaurant_id: req.params.id });
    await RestaurantVisit.deleteMany({ restaurant_id: req.params.id });
    await Comment.deleteMany({ restaurant_id: req.params.id }); //Delete the comments
    await MenuPdf.deleteMany({ restaurant_id: req.params.id });
    await Restaurant.findByIdAndDelete(req.params.id)
      .then((deletedRestaurant) => {
        return User.findByIdAndUpdate(
          req.params.userId,
          { $pull: { restaurants: req.params.id } },
          { new: true } // Return the updated user document
        );
      })
      .then((updatedUser) => {
        // Successfully removed the deleted restaurant's ObjectId from the user's restaurants field
        res.status(200).json({ success: true }); // Send success response to client
      })
      .catch((err) => {
        // Handle error
        res
          .status(500)
          .json({ success: false, error: "Failed to delete branch" }); // Send error response to client
      });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" }); // Send error response to client
  }
};

/*UPDATE BRANCH*/

export const updateBranch = async (req, res) => {
  try {
    const { _id, name, address, phone } = req.body;
    await Restaurant.updateOne(
      { _id: _id },
      { $set: { name: name, address: address, phone: phone } }
    );
    res.status(200).json({ message: "Branch updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*ADD MENU*/

export const saveMenu = async (req, res) => {
  try {
    const { branchId } = req.params; // Retrieve the restaurant ID from the request parameters
    let { menu, isPdf, settings, colors, planId } = req.body; // Retrieve the menu from the request body

    if (planId === PLAN_IDS[0] && isPdf) {
      res.status(500).json({ error: "This plan cannot use PDF" });
    }

    if (planId === PLAN_IDS[0]) {
      colors = {
        backgroundColor: "#ffffff",
        itemColor: "#eeeeee",
        textColor: "#ffffff",
      };
      settings = { showComment: false, showLogo: false };
    }

    let deletedMenuPdf;
    let updatedRestaurant;
    let deletedRestaurant;

    if (!isPdf) {
      deletedMenuPdf = await MenuPdf.findOneAndDelete({
        restaurant_id: branchId,
      });

      if (!deletedMenuPdf) {
      }

      updatedRestaurant = await Restaurant.updateOne(
        { _id: branchId },
        { $set: { menu, isPdf, settings, colors } }
      );

      if (!updatedRestaurant) {
        return res.status(404).json({ error: "Restaurant not found." });
      }
    } else {
      updatedRestaurant = await Restaurant.updateOne(
        { _id: branchId },
        {
          $set: {
            menu: [],
            isPdf,
            settings: { showLogo: false, showComment: false },
            colors: {
              backgroundColor: "#ffffff",
              itemColor: "#eeeeee",
              textColor: "#000000",
            },
          },
        }
      );

      if (!updatedRestaurant) {
        return res
          .status(404)
          .json({ error: "Menu could not deleted when PDF is selected." });
      }
    }

    res.status(200).json(updatedRestaurant); // Send the updated restaurant as a response
  } catch (error) {
    res.status(500).json({ error: "An error occurred while adding the menu." });
  }
};

/*GET MENU FOR CUSTOMERS*/

export const getMenuForCustomers = async (req, res) => {
  try {
    let branches;
    branches = await Restaurant.find({ _id: req.params.id });

    const restaurantVisit = await RestaurantVisit.findOne({
      restaurant_id: req.params.id,
    });
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    if (!restaurantVisit) {
      // If the document doesn't exist, create a new one
      const newRestaurantVisit = new RestaurantVisit({
        restaurant_id: req.params.id,
        data: [
          {
            year: currentYear.toString(),
            months: Array(12).fill(0), // Sets all months to 0
            tablet: isTablet ? 1 : 0,
            phone: isMobile ? 1 : 0,
            desktop: isDesktop ? 1 : 0,
          },
        ],
      });
      newRestaurantVisit.data[0].months[currentMonth] = 1;
      await newRestaurantVisit.save();
    } else {
      if (
        restaurantVisit?.data?.filter?.((rv) => rv.year == currentYear)
          ?.length === 0
      ) {
        // If the year does not exist
        const newData = {
          year: currentYear.toString(),
          months: Array(12).fill(0), // Sets all months to 1
          tablet: isTablet ? 1 : 0,
          phone: isMobile ? 1 : 0,
          desktop: isDesktop ? 1 : 0,
        };
        newData.months[currentMonth] = 1;
        restaurantVisit.data.push(newData);
        await restaurantVisit.save();
      } else {
        restaurantVisit.data.filter((rv) => rv.year == currentYear)[0].months[
          currentMonth
        ] += 1;
        if (isDesktop) {
          restaurantVisit.data.filter(
            (rv) => rv.year == currentYear
          )[0].desktop += 1;
        } else if (isMobile) {
          restaurantVisit.data.filter(
            (rv) => rv.year == currentYear
          )[0].phone += 1;
        } else if (isTablet) {
          restaurantVisit.data.filter(
            (rv) => rv.year == currentYear
          )[0].tablet += 1;
        }
        await restaurantVisit.save();
      }
    }

    res.status(200).json(branches);
  } catch (error) {
    throw new Error("Error while getting restaurant by user id");
  }
};
