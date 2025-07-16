import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

async function getFacebookVideo(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://snapsave.app/facebook-reels-download", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector("#url");
    await page.type("#url", url);

    await page.click('button[type="submit"]');

    await page.waitForSelector(".button.is-success.is-small", {
      timeout: 30000,
    });

    const videoLink = await page.evaluate(() => {
      const link = document.querySelector(".button.is-success.is-small");
      return link ? link.href : null;
    });

    if (!videoLink) {
      return { success: false, error: "Tidak ada video link ditemukan." };
    }

    return { success: true, video_url: videoLink, title: "Tanpa Judul" };
  } catch (err) {
    return {
      success: false,
      error: "SnapSave scrape failed",
      detail: err.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  try {
    const result = await getFacebookVideo(url);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Internal Server Error", detail: error.message });
  }
}
