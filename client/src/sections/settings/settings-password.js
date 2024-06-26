import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  TextField,
} from "@mui/material";
import { useAuth } from "src/hooks/use-auth";
import { useAuthContext } from "src/contexts/auth-context";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "src/components/confirmModal";

export const SettingsPassword = ({ setSnackbarOpen, setSnackbarSeverity, setSnackbarMessage }) => {
  const auth = useAuth();
  const state = useAuthContext();

  const { t } = useTranslation();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [values, setValues] = useState({
    password: "",
    confirm: "",
  });

  var regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleChange = useCallback((event) => {
    setValues((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setConfirmModalOpen(true);
    },
    [values],
  );

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader
          subheader={t("account.passwordRequirements")}
          title={t("account.updatePassword")}
        />
        <Divider />
        <CardContent>
          <Stack spacing={3} sx={{ maxWidth: 400 }}>
            <TextField
              fullWidth
              label={t("account.password")}
              name="password"
              onChange={handleChange}
              type="password"
              value={values.password}
            />
            <TextField
              fullWidth
              label={t("account.passwordConfirm")}
              name="confirm"
              onChange={handleChange}
              type="password"
              value={values.confirm}
            />
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            type="submit"
            disabled={values.password !== values.confirm || !regex.test(values.password)}
          >
            {t("common.save")}
          </Button>
        </CardActions>
      </Card>
      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
        }}
        leftButtonMessage={t("common.back")}
        rightButtonMessage={t("account.updatePassword")}
        title={t("account.updatePassword")}
        // description={t("account.passwordRequirements")}
        leftAction={() => {
          setConfirmModalOpen(false);
        }}
        rightAction={() => {
          if (values.password === values.confirm && regex.test(values.password))
            auth
              .updatePassword(state?.user?.user?._id, values.password)
              .then((res) => {
                if (res.message) {
                  setSnackbarOpen(true);
                  setSnackbarSeverity("success");
                  setSnackbarMessage("Password updated successfully!");
                } else if (res.success === false) {
                  setSnackbarOpen(true);
                  setSnackbarSeverity("error");
                  setSnackbarMessage("Password change error");
                }
              })
              .catch((err) => {
                setSnackbarOpen(true);
                setSnackbarSeverity("error");
                setSnackbarMessage("Password change error");
              });
          setValues({ password: "", confirm: "" });
          setConfirmModalOpen(false);
        }}
      />
    </form>
  );
};
