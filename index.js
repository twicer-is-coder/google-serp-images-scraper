const puppeteer = require('puppeteer-extra');
const fse = require('fs-extra');
const path = require('path');

const { getElementsByXpath, getElementByXpath, delay, decodeBase64Image, download, centerAndBorder } = require('./util.js')

let browser;
const launchBrowserAndGetPage = async () => {

    const args = process.env.NODE_ENV === 'production' ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--user-data-dir=${__dirname}/assets/profile/chrome/DefaultData`,
        `--window-size=${1280},${900}`

    ] : [
        // `--window-size=${1280},${900}`,
        `--user-data-dir=${__dirname}/assets/profile/chrome/DefaultData`
    ];

    if (browser) await browser.close()

    browser = await puppeteer.launch({
        args,
        headless: process.env.NODE_ENV === 'production' ? true : false,
        defaultViewport: null,
    });
    const context = await browser.defaultBrowserContext()
    await context.overridePermissions('https://docs.google.com', ['clipboard-read'])

    const [blankPage] = await browser.pages();
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);
    await blankPage.close();
    return page
}

const SEARCH_TERM = "animals";

(async () => {
    const page = await launchBrowserAndGetPage();
    await page.goto(`https://www.google.com/search?q=${SEARCH_TERM}&source=lnms&tbm=isch`, { waitUntil: "networkidle2" });

    const images = await getElementsByXpath("//div[@data-root-margin-pages]//div[@data-ved]", page)
    //div[@data-root-margin-pages]//div[@data-ved]//a[2][@href]
    console.log(`Total Images Found!: ${images.length}`)
    await fse.emptyDir(path.resolve(__dirname, `./images`))

    for (const [index, imageHandle] of images.entries()) {
        try {

            await centerAndBorder(imageHandle)

            const linkHandle = await getElementByXpath(".//a[2]", imageHandle)
            const link = await linkHandle.evaluate(e => e.href) //THIS VAR CONTAINS IMAGE PAGE URL

            const titleHandle = await getElementByXpath(".//span", imageHandle)
            const title = await titleHandle.evaluate(e => e.textContent)    //THIS VAR CONTAINS IMAGE TITLE

            const imgHandle = await getElementByXpath(".//img", imageHandle) //THIS VAR CONTAINS IMAGE URL
            const img = await imgHandle.evaluate(e => e.src)

            console.log(`*****************${index}*********************\n`)
            console.log(`Link: ${link}\nTitle: ${title} \nImage: ${img.substr(0, 50)}`)

            await fse.mkdirp(path.resolve(__dirname, `./images/${SEARCH_TERM}`))
            // await fse.writeFile(path.resolve(__dirname, `./images/${SEARCH_TERM}/${index}/title.txt`), title);
            // await fse.writeFile(path.resolve(__dirname, `./images/${SEARCH_TERM}/${index}/link.txt`), link);
            if (img.includes("data")) {
                const base64Data = decodeBase64Image(img);
                await fse.writeFile(path.resolve(__dirname, `./images/${SEARCH_TERM}/${index}.png`), base64Data.data, "base64")
            }
            else if (img === "") {
                console.log("EMPTY!!!")
            }
            else {
                await download(img, path.resolve(__dirname, `./images/${SEARCH_TERM}/${index}.png`))
            }
        } catch (error) {
            console.log(`Error in ${index}. ${error.message}`)
        }
        finally {
            console.log(`\n*****************${"END"}*********************\n`)
            await delay(100);
        }
    }

    console.log("Done!")
})()