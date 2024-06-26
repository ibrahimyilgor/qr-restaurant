import { createContext, useContext, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/navigation";
import { useAuthContext } from "./auth-context";

export const RestaurantContext = createContext({ undefined });

export const RestaurantProvider = (props) => {
  const { children } = props;
  const [restaurants, setRestaurants] = useState([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState();
  const router = useRouter();
  const state = useAuthContext();

  useEffect(
    () => {
      if (state?.user?.token) {
        getBranches(state?.user?.user?._id, state?.user?.token, null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state?.user?.token]
  );

  const getBranches = async (id, token, name = null) => {
    const restaurantResponse = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_SERVER + `/restaurant/${id}`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );
    const tempRestaurant = await restaurantResponse.json();

    setRestaurants(tempRestaurant);

    return tempRestaurant;
  };

  const addBranch = async ({ id, name, address, phone }) => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_SERVER + `/restaurant/${id}/addBranch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + state?.user?.token,
          },
          body: JSON.stringify({
            name,
            address,
            phone,
          }),
        }
      );

      const data = await response.json();
      if (data.restaurant) {
        data.success = true;
      } else {
        data.success = false;
      }
      return data;
    } catch (err) {
      err.success = false;
      console.error(err);
      return err;
    }
  };

  const deleteBranch = async (id, userId) => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_SERVER +
          `/restaurant/${id}/${userId}/deleteBranch`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + state?.user?.token,
          },
        }
      );
      const data = await response.json();
      if (selectedBranchIds === id) {
        setSelectedBranchIds();
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        setRestaurants,
        getBranches,
        addBranch,
        deleteBranch,
        selectedBranchIds,
        setSelectedBranchIds,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

RestaurantProvider.propTypes = {
  children: PropTypes.node,
};

export const RestaurantConsumer = RestaurantContext.Consumer;

export const useRestaurantContext = () => useContext(RestaurantContext);
