import { useEffect, useState } from "react";
import Head from "next/head";
import { Box, Container, Stack } from "@mui/material";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import MenuForCustomers from "src/components/menu-for-customers";
import CustomizedSnackbars from "src/sections/snackbar";
import usePrevious from "src/utils/use-previous";

const Branchmenu = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const [idState, setIdState] = useState();
  const [menu, setMenu] = useState([]);
  const [isPdf, setIsPdf] = useState(false);
  const [settings, setSettings] = useState({});
  const [colors, setColors] = useState({});
  const [pdfPreview, setPdfPreview] = useState("");
  const [file, setFile] = useState();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPdfPreview(reader.result);
      };

      reader.readAsDataURL(file);
    } else {
      setPdfPreview("");
    }
  }, [file]);

  useEffect(() => {
    setIdState(id);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      if (idState) {
        const menuResponse = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_SERVER + `/restaurant/${idState}/getMenuForCustomers`,
          {
            method: "GET",
          },
        );
        const tempMenu = await menuResponse.json();

        const response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_SERVER + `/pdfMenu/${idState}`,
          {
            method: "GET",
          },
        );

        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], "fileName", { type: "application/pdf" });
          setFile(file);
        } else {
          setFile(null);
        }

        setMenu(tempMenu?.[0].menu || []);
        setSettings(tempMenu?.[0].settings || {});
        setColors(tempMenu?.[0].colors || {});
        setIsPdf(tempMenu?.[0]?.isPdf);

        const htmlElement = document.querySelector("html"); // Get the <html> element

        htmlElement.style.backgroundColor = tempMenu?.[0]?.colors?.backgroundColor ?? "#ffffff";
      }
    };

    fetchData().catch(console.error);
  }, [idState]);

  return (
    <Box sx={{ backgroundColor: colors?.backgroundColor ?? "#ffffff", height: "100vh" }}>
      <Head>
        <title>{t("titles.branches")}</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Stack spacing={3}>
          <Stack direction="column" justifyContent="space-between" spacing={4}>
            {!isPdf && (
              <MenuForCustomers
                menu={menu}
                setMenu={setMenu}
                settings={settings}
                colors={colors}
                setSnackbarOpen={setSnackbarOpen}
                setSnackbarSeverity={setSnackbarSeverity}
                setSnackbarMessage={setSnackbarMessage}
              />
            )}

            {isPdf && (
              <iframe
                src={pdfPreview ? pdfPreview + "#toolbar=0&navpanes=0&view=fitH" : pdfPreview}
                title="PDF Preview"
                style={{ width: "100vw", height: "100vh" }}
                frameborder="0"
              ></iframe>
            )}
          </Stack>
        </Stack>
      </Box>
      <CustomizedSnackbars
        open={snackbarOpen}
        setOpen={setSnackbarOpen}
        severity={snackbarSeverity}
        message={snackbarMessage}
      />
    </Box>
  );
};

Branchmenu.getLayout = (branchmenu) => <DashboardLayout>{branchmenu}</DashboardLayout>;

export default Branchmenu;
