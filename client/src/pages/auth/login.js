import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Alert,
  Box,
  Button,
  FormHelperText,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAuth } from "src/hooks/use-auth";
import { Layout as AuthLayout } from "src/layouts/auth/layout";
import { useTranslation } from "react-i18next";

const Page = (props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      submit: null,
    },
    validateOnBlur: false,
    validateOnChange: true,
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t("login.mustBeAValidEmail"))
        .max(255)
        .required(t("login.emailIsRequired")),
      password: Yup.string().max(255).required(t("login.passwordIsRequired")),
    }),
    onSubmit: async (values, helpers) => {
      try {
        await auth.signIn(values, null);
      } catch (err) {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message });
        helpers.setSubmitting(false);
      }
    },
  });

  return (
    <>
      <Head>
        <title>{t("titles.login")}</title>
      </Head>
      <Box
        sx={{
          backgroundColor: "background.paper",
          flex: "1 1 auto",
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            maxWidth: 550,
            px: 3,
            py: "100px",
            width: "100%",
          }}
        >
          <div>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="h4">{t("login.title")}</Typography>
              <Typography color="text.secondary" variant="body2">
                {t("login.doYouHaveAnAccount")}
                <Link
                  component={NextLink}
                  href="/auth/register"
                  underline="hover"
                  variant="subtitle2"
                >
                  {t("login.register")}
                </Link>
              </Typography>
            </Stack>
            <form noValidate onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  helperText={formik.touched.email && formik.errors.email}
                  label={t("login.email")}
                  name="email"
                  // onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  type="email"
                  value={formik.values.email}
                />
                <TextField
                  fullWidth
                  helperText={formik.touched.password && formik.errors.password}
                  label={t("login.password")}
                  name="password"
                  // onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  type="password"
                  value={formik.values.password}
                />
              </Stack>
              <Button
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                type="submit"
                variant="contained"
                disabled={formik.errors.email || formik.errors.password}
              >
                {t("login.continue")}
              </Button>
              <Link
                component={NextLink}
                href="/auth/forgot-password"
                underline="hover"
                variant="subtitle2"
              >
                <Button
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  type="submit"
                  variant="text"
                  disabled={formik.errors.email || formik.errors.password}
                >
                  {t("login.forgotPassword")}
                </Button>
              </Link>
              <Button
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                variant="text"
                onClick={() => {
                  formik.setValues({
                    ...formik.values,
                    email: "test@test.test",
                    password: "Test123!",
                  });
                }}
              >
                {t("login.testAccount")}
              </Button>
            </form>
          </div>
        </Box>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default Page;
