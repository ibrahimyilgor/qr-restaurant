import { useCallback } from "react";
import { useRouter } from "next/navigation";
import PropTypes from "prop-types";
import { Box, Divider, MenuItem, MenuList, Popover, Typography } from "@mui/material";
import { useAuth } from "src/hooks/use-auth";
import { useAuthContext } from "src/contexts/auth-context";
import { useTranslation } from "react-i18next";

export const AccountPopover = (props) => {
  const { anchorEl, onClose, open } = props;
  const router = useRouter();
  const auth = useAuth();
  const state = useAuthContext();
  const { t } = useTranslation();

  const handleSignOut = useCallback(() => {
    onClose?.();
    auth.signOut();
    router.push("/auth/login");
  }, [onClose, auth, router]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: "left",
        vertical: "bottom",
      }}
      onClose={onClose}
      open={open}
      PaperProps={{ sx: { width: 225 } }}
    >
      <Box
        sx={{
          py: 1.5,
          px: 2,
        }}
      >
        <Typography variant="overline">{t("topNav.accountPopover.account")}</Typography>
        <Typography color="text.secondary" variant="body2">
          {state?.user?.user?.email}
        </Typography>
      </Box>
      <Divider />
      <MenuList
        disablePadding
        dense
        sx={{
          p: "8px",
          "& > *": {
            borderRadius: 1,
          },
        }}
      >
        <MenuItem onClick={handleSignOut}>{t("topNav.accountPopover.signOut")}</MenuItem>
      </MenuList>
    </Popover>
  );
};

AccountPopover.propTypes = {
  anchorEl: PropTypes.any,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
};
