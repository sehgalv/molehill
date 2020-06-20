
function getDirectLastText(ele) {
    let txt = null;
    [].forEach.call(ele.childNodes, function (v) {
        if (v.nodeType === 3) txt = v.textContent.replace(/^\W*\n/, '')
    })
    return txt
}

function convert_units_to_mm_or_g(unit, value) {
    let unit_dictionary = {'inches': 25.4, 'in': 25.4, 'inch': 25.4, 'ins': 25.4,
        'feet': 25.4*12, 'ft': 25.4*12, 'foot': 25.4*12,
        'millimeters': 1, 'mm': 1, 'millimeter': 1, 'mms': 1,
        'centimeters': 10, 'cm': 10, 'centimeter': 10, 'cms': 10,
        'meters': 1000, 'm': 1000, 'meter': 1000, 'ms': 1000,
        'pounds': 453.592, 'lbs': 453.592, 'lb': 453.592, 'pound': 453.592,
        'ounces': 453.592/16, 'oz': 453.592/16, 'ozs': 453.592/16, 'ounce': 453.592/16,
        'grams': 1, 'g': 1, 'gram': 1, 'gs': 1,
        'kilograms': 1000, 'kg': 1000, 'kilogram': 1000, 'kgs': 1000};

    if (!Object.keys(unit_dictionary).includes(unit)) {
        return -1
    } else {
        return value*unit_dictionary[unit]
    }
}

function find_spec_element(match_type) {
    let match_strings = []

    // set an array of strings to match to depending on if we're looking for dimensions or weight
    if (match_type === 'dimension') {
        match_strings = ['Product Dimensions', 'Package Dimensions', 'Size', 'Assembled Product Dimensions (L x W x H)']
    } else if (match_type === 'weight') {
        match_strings = ['Item Weight', 'Weight', 'Assembled Product Weight']
    } else {
        return false
    }

    let all_elements = document.getElementsByTagName('*')
    let match_elements = []
    let text_element

    // find all elements in page that match the strings we're searching for
    for (let i = 0; i < all_elements.length; i++) {
        let element_text = getDirectLastText(all_elements[i])
        if (element_text) {
            if (match_strings.includes(element_text.trim())) {
                match_elements.push(all_elements[i])
            }
        }
    }

    if (match_elements.length > 0) {
        // sort through matching elements and select the one most likely to be correct
        for (let i = 0; i < match_elements.length; i++) {
            if (match_elements[i].className.includes('ProdDetSectionEntry')) {
                text_element = match_elements[i]
            }
        }
        if (!text_element) {
            text_element =  match_elements[0]
        }

        // assuming element is part of a table, find the nearest parent element that is <td>, <th>, or <tr>
        return get_nearest_table_parent(text_element).nextElementSibling

    } else {
        // if no matching elements found, return false
        return false
    }
}

function get_nearest_table_parent(element) {
    if (element.tagName.match(/T[A-Z]/) && element.tagName.length === 2) {
        return element
    } else {
        return get_nearest_table_parent(element.parentElement)
    }
}

function scrape_data(prod_id, site_name) {

    // initialize some variables
    let prod_dimens, dimens_text, dimens_unit, dimens_array, prod_weight, weight_text, weight_unit, weight_float

    let product_title, div_bread_crumb, list_bread_crumb, table_name
    switch (site_name) {
        case 'amazon':
            product_title = document.getElementById('productTitle').innerText
            div_bread_crumb = document.getElementById('wayfinding-breadcrumbs_feature_div')
            list_bread_crumb = div_bread_crumb.getElementsByTagName('ul')[0]
            table_name = 'amazon_test'
            break
        case 'walmart':
            product_title = document.getElementsByClassName('prod-ProductTitle')[0].innerText
            div_bread_crumb = document.getElementsByClassName('breadcrumb-list')[0]
            list_bread_crumb = div_bread_crumb
            table_name = 'walmart_test'
            break
    }

    // find product weight ---------------------------------------------------------------------------------------------
    prod_dimens = find_spec_element('dimension')
    if (prod_dimens) {
        dimens_text = prod_dimens.innerText

        // check for multiple units of dimensions by looking for '(' and remove them and anything that follows
        if (dimens_text.includes('(')) {
            dimens_text = dimens_text.slice(0, dimens_text.indexOf('(')).trim()
        }

        // if " is used for inches, set units manually and remove all " from string (unicode \u201D used for ")
        if (dimens_text.includes('\u201D')) {
            dimens_unit = 'inches'
            dimens_text = dimens_text.replace(/\u201D/g, '')
        } else {
            dimens_unit = dimens_text.slice(dimens_text.lastIndexOf(' '), ).trim()
            dimens_text = dimens_text.slice(0, dimens_text.lastIndexOf(' ')).trim()
        }

        // create array from dimension values and use units to convert to millimeters
        dimens_array = dimens_text.split('x')

        for (let i = 0; i < dimens_array.length; i++) {
            dimens_array[i] = convert_units_to_mm_or_g(dimens_unit.toLowerCase(), parseFloat(dimens_array[i]))
        }
    } else {
        dimens_unit = 'None'
        dimens_array = [0, 0, 0]
    }

    // find product weight ---------------------------------------------------------------------------------------------
    prod_weight = find_spec_element('weight')
    if (prod_weight) {
        weight_text = prod_weight.innerText

        // check for multiple units of dimensions by looking for '(' and remove them and anything that follows
        if (weight_text.includes('(')) {
            weight_text = weight_text.slice(0, weight_text.indexOf('(')).trim()
        }

        // find units
        weight_unit = weight_text.slice(weight_text.lastIndexOf(' '), ).trim()

        // use units to convert to grams
        weight_float = convert_units_to_mm_or_g(weight_unit.toLowerCase(),
            parseFloat(weight_text.slice(0, weight_text.lastIndexOf(' '))))
    } else {
        weight_unit = 'None'
        weight_float = 0
    }

    // get product category --------------------------------------------------------------------------------------------
    let bread_crumbs = []
    if (div_bread_crumb) {
        for (let i = 0; i < list_bread_crumb.children.length; i++) {
            // if statement to ignore '>' dividers in category list
            if (list_bread_crumb.children[i].className !== 'a-breadcrumb-divider') {
                let bread_crumb_text = list_bread_crumb.children[i].innerText
                if (bread_crumb_text.trim().startsWith('/')) {
                    bread_crumb_text = bread_crumb_text.slice(1, )
                }
                bread_crumbs.push(bread_crumb_text)
            }}}

    //reverse array to put most detailed category first
    bread_crumbs.reverse()

    // log to console --------------------------------------------------------------------------------------------------
    console.log('Product ID = ' + prod_id)
    console.log('Title = ' + product_title)
    console.log('Category = ' + bread_crumbs.join(', '))
    console.log('Dimension Units = ' + dimens_unit)
    console.log('Dimensions Array = ' + dimens_array)
    console.log('Weight Units = ' + weight_unit)
    console.log('Weight Value = ' + weight_float)

    //  create and send http request to save data to DB ----------------------------------------------------------------
    let scrape_req = new XMLHttpRequest(), server_url, request_url
    server_url = 'http://127.0.0.1/molehill/scrape.php'
    request_url = server_url + '?' +
        'Table=' + table_name + '&' +
        'ProdID=' + prod_id + '&' +
        'Title=' + product_title.replace(/ /g, '_') + '&' +
        'Category=' + bread_crumbs.join(',').replace(/ /g, '_') + '&' +
        'D_Units=' + dimens_unit + '&' +
        'D_Values=' + dimens_array.join(',') + '&' +
        'W_Units=' + weight_unit + '&' +
        'W_Value=' + weight_float + '&' +
        'url=' + window.location.href
    console.log(request_url)
    scrape_req.open('GET', request_url)
    scrape_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    scrape_req.onreadystatechange = function() {
        if (scrape_req.readyState === 4) {
            console.log(scrape_req.responseText)
            display_offset()
        }
    }
    scrape_req.send()
}

function set_offset_price(offset_div, response_text) {
    let offset_price = parseFloat(response_text)
    offset_div.innerText = '+ $' + offset_price.toString() + ' to carbon offset'
}

function display_offset() {
    // search for purchase buttons and display offset cost below
    let price_element = document.getElementById('priceInsideBuyBox_feature_div')
    let offset_div = document.createElement('div')
    price_element.parentElement.insertBefore(offset_div, price_element.nextElementSibling)

    let offset_req = new XMLHttpRequest(), server_url, request_url
    server_url = 'http://127.0.0.1/molehill/offset.php'
    request_url = server_url + '?' +
        'ASIN=' + asin
    console.log(request_url)
    offset_req.open('GET', request_url, true)
    offset_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    offset_req.onreadystatechange = function() {
        if (offset_req.readyState === 4) {
            set_offset_price(offset_div, offset_req.responseText)
        }
    }
    offset_req.send(null)
}

function add_molehill_button() {
    let submit_buttons = [document.getElementById('submitOrderButtonId'),
        document.getElementById('bottomSubmitOrderButtonId')]
    for (let i = 0; i < submit_buttons.length; i++) {
        let new_button = document.createElement("button")
        new_button.innerText = 'Molehill Page'
        new_button.style.cssText = 'width: 100%; padding: 5px; background-color: lightgreen; margin-top: 5px; ' +
            'border-radius: 5px; border-color: silver'
        new_button.addEventListener('click', function() {
            window.open('https://www.google.com')
        })
        submit_buttons[i].parentNode.insertBefore(new_button, submit_buttons[i].nextSibling)
    }
}

// look for ASIN in url
const asin_reg_ex = /\/[A-Z0-9]{10}[\/?]/
let asin_matches = window.location.href.match(asin_reg_ex)
if (asin_matches) {
    asin = asin_matches[0].slice(1, -1)
} else {
    asin = null
}

// if amazon product page, scrape product data and send to server
if (window.location.href.includes('amazon.com') && asin) {
    scrape_data(asin, 'amazon')

} else if (window.location.href.includes('amazon.com/gp/buy/spc/handlers/display.html')) {
    add_molehill_button()
}

// if walmart product page, scrape data
if (window.location.href.includes('walmart.com/ip')) {
    let walmart_id = getDirectLastText(document.getElementsByClassName('wm-item-number')[0])
    scrape_data(walmart_id, 'walmart')
}
