import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/navigation";
import jwt from "jsonwebtoken";
import { links } from "src/pages/404";
import CustomizedSnackbars from "src/sections/snackbar";
import { useTranslation } from "react-i18next";
import i18n from "src/i18n";

export const HANDLERS = {
  INITIALIZE: "INITIALIZE",
  SIGN_IN: "SIGN_IN",
  SIGN_OUT: "SIGN_OUT",
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      ...// if payload (user) is provided, then is authenticated
      (user
        ? {
            isAuthenticated: true,
            isLoading: false,
            user,
          }
        : {
            isLoading: false,
          }),
    };
  },
  [HANDLERS.SIGN_IN]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      user,
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null,
    };
  },
};

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

// The role of this context is to propagate authentication state through the App tree.

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const [userAvatar, setUserAvatar] = useState();
  const [userAvatarSrc, setUserAvatarSrc] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const { t } = useTranslation();

  const initialized = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (userAvatar) {
      const reader = new FileReader();
      reader.onload = () => {
        setUserAvatarSrc(reader.result);
      };
      reader.readAsDataURL(userAvatar);
    }
  }, [userAvatar]);

  const initialize = async () => {
    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    let isAuthenticated = false;

    try {
      isAuthenticated = window.sessionStorage.getItem("user") !== null;
    } catch (err) {}

    let tempUser = window.sessionStorage.getItem("user");
    if (tempUser) {
      tempUser = JSON.parse(tempUser);
    }

    if (isAuthenticated) {
      const decode = jwt.verify(tempUser, "SSEECCRREETT");

      if (decode?.id) {
        getUser(decode.id);
      } else {
        dispatch({
          type: HANDLERS.SIGN_OUT,
        });
      }
    } else {
      dispatch({
        type: HANDLERS.INITIALIZE,
      });
    }
  };

  useEffect(
    () => {
      initialize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (state?.user?.user?._id) {
      fetchUserAvatar(state?.user?.user?._id);
    }
  }, [state]);

  const fetchUserAvatar = async (id) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_SERVER + `/userAvatar/${id}`, {
        method: "GET",
      });

      if (response.status === 404) {
        setUserAvatar(null);
      }
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], "fileName", { type: "image/*" });
        setUserAvatar(file);
      } else {
        setUserAvatar(null);
      }
    } catch (error) {
      setUserAvatar(null);
    }
  };

  const getUser = async (id) => {
    const userResponse = await fetch(process.env.NEXT_PUBLIC_BACKEND_SERVER + "/user/" + id, {
      method: "GET",
      headers: {
        Authorization:
          "Bearer " + (state?.user?.token || JSON.parse(window.sessionStorage.getItem("user"))),
      },
    });

    const tempUser = await userResponse.json();

    const user = {
      token: state?.user?.token || JSON.parse(window.sessionStorage.getItem("user")),
      user: {
        _id: tempUser?._id,
        name: tempUser?.name,
        createdAt: tempUser?.createdAt,
        email: tempUser?.email,
        address: tempUser?.address,
        phone: tempUser?.phone,
        restaurants: tempUser?.restaurants,
        plan_id: tempUser?.plan_id,
        role: tempUser?.role,
        plan_expiration_date: tempUser?.plan_expiration_date,
      },
    };

    dispatch({
      type: HANDLERS.INITIALIZE,
      payload: user,
    });

    return tempUser;
  };

  const deleteUser = async (id, deleteByAdmin = false) => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_SERVER + `/user/${id}/deleteUser`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + state?.user?.token,
          },
        },
      );
      const data = await response.json();
      if (!deleteByAdmin) {
        dispatch({
          type: HANDLERS.SIGN_OUT,
        });
        sessionStorage.removeItem("user");
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  const updatePassword = async (id, password) => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_SERVER + "/auth/updatePassword",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + state?.user?.token,
          },
          body: JSON.stringify({ _id: id, password: password }),
        },
      );
      const data = await response.json();

      return data;
    } catch (error) {
      return { success: false };
    }
  };

  const forgotPassword = async (values, onSubmitProps) => {
    try {
      const loggedInResponse = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_SERVER + "/auth/forgotPassword",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, lang: i18n.languages[0] }),
        },
      );

      const loggedIn = await loggedInResponse.json();
      if (loggedIn?.error === "no user found") {
        setSnackbarOpen(true);
        setSnackbarSeverity("error");
        setSnackbarMessage(t("login.forgotPasswordErrorMessage"));
      } else {
        setSnackbarOpen(true);
        setSnackbarSeverity("success");
        setSnackbarMessage(t("login.forgotPasswordSuccessMessage"));
      }
      return loggedIn;
    } catch (error) {
      setSnackbarOpen(true);
      setSnackbarSeverity("error");
      setSnackbarMessage(t("login.forgotPasswordErrorMessage"));
      throw error;
    }
  };

  const changePassword = async (values, token) => {
    try {
      const loggedInResponse = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_SERVER + "/auth/changePassword",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, token }),
        },
      );

      const loggedIn = await loggedInResponse.json();
      setSnackbarOpen(true);
      setSnackbarSeverity("success");
      setSnackbarMessage(t("login.changePasswordSuccessMessage"));

      const loginPagePath = "/auth/login";
      const currentHost = window.location.host;
      const currentProtocol = window.location.protocol;
      const loginPageURL = currentProtocol + "//" + currentHost + loginPagePath;

      window.location.href = loginPageURL;

      return loggedIn;
    } catch (error) {
      setSnackbarOpen(true);
      setSnackbarSeverity("error");
      setSnackbarMessage(t("login.changePasswordErrorMessage"));
      throw error;
    }
  };

  const signIn = async (values, onSubmitProps) => {
    const loggedInResponse = await fetch(process.env.NEXT_PUBLIC_BACKEND_SERVER + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const loggedIn = await loggedInResponse.json();

    if (loggedIn.token) {
      dispatch({
        type: HANDLERS.SIGN_IN,
        payload: loggedIn,
      });
      window.sessionStorage.setItem("user", JSON.stringify(loggedIn.token));

      setSnackbarOpen(true);
      setSnackbarSeverity("success");
      setSnackbarMessage(t("login.loginSuccessMessage"));

      router.push(links[loggedIn?.user?.role]);
    } else {
      setSnackbarOpen(true);
      setSnackbarSeverity("error");
      setSnackbarMessage(t("login.loginErrorMessage"));
    }

    return loggedIn;
  };

  const signUp = async (formData) => {
    try {
      const savedUserResponse = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_SERVER + "/auth/register",
        {
          method: "POST",
          body: formData,
        },
      );

      const savedUser = await savedUserResponse.json();
      setSnackbarOpen(true);
      setSnackbarSeverity("success");
      setSnackbarMessage(t("register.successMessage"));
      return savedUser;
    } catch (error) {
      setSnackbarOpen(true);
      setSnackbarSeverity("error");
      setSnackbarMessage(t("register.errorMessage"));
      throw error;
    }
  };

  const signOut = () => {
    dispatch({
      type: HANDLERS.SIGN_OUT,
    });
    setUserAvatar();
    setUserAvatarSrc();
    sessionStorage.removeItem("user");
  };

  return (
    <>
      <AuthContext.Provider
        value={{
          ...state,
          forgotPassword,
          changePassword,
          signIn,
          signUp,
          signOut,
          getUser,
          deleteUser,
          updatePassword,
          userAvatar,
          setUserAvatar,
          fetchUserAvatar,
          userAvatarSrc,
          setUserAvatarSrc,
        }}
      >
        {children}
      </AuthContext.Provider>
      <CustomizedSnackbars
        open={snackbarOpen}
        setOpen={setSnackbarOpen}
        severity={snackbarSeverity}
        message={snackbarMessage}
      />
    </>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuthContext = () => useContext(AuthContext);
