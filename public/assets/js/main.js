var data = [];
var quantity_scanned_before = 0;
var handle_selected_row = null;
var flag_initialized = false;
jQuery(document).ready(function ($) {
    $('#input_scan').focus();
    $("#input_scan").keyup(function (event) {
        if (event.keyCode === 13) {
            $("#btn_scan").click();
        }
    });
    $('#btn_scan').click(function () {
        if ($('#btn_scan').text() == "Scan order") {
            let order_id = $('#input_scan').val();
            if ((order_id == "") && flag_initialized)
                flag_initialized = false;
            else if (order_id == "") {
                Swal.fire('Please input order id!');
                document.getElementById("audio_wrong").play();
                //$('#audio_wrong')[0].play();

                var curTime = new Date();
                var LogData = { logdata: `Empty Order Input => Please input order id! ::: ${curTime}` };
                $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                    console.log("save log result: ", result);
                });

            } else {
                $('.loader').show();
                show_order_data(order_id);
            }
        }
        else if ($('#btn_scan').text() == "Scan item") {
            let find_item = $('#input_scan').val();
            if (find_item == "") {
                document.getElementById('audio_wrong').play();
                Swal.fire('Please input SKU or UPC!');

                var curTime = new Date();
                var LogData = { logdata: `Empty Item Input => Please input SKU or UPC! ::: ${curTime}` };
                $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                    console.log("save log result: ", result);
                });
            }
            else
                show_item_data(find_item);
        }

    });
    $('#div_table').on('click', '.fa-edit', function (event) {
        let temp_arr = event.target.parentNode.parentNode.cells[4].innerHTML.split('/');
        $('#title_quantity').text(event.target.parentNode.parentNode.cells[1].innerHTML);
        let modal_body_detail = `
            <div class="d-flex justify-content-between">
                <span>Quantity ordered:</span>
                <span id="quantity_ordered_num">${temp_arr[0]}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span>Quantity scanned:</span>
                <input id="input_quantity_scanned" type="number" min=0 max=${temp_arr[0]} value=${temp_arr[1]} style="width:65px">
            </div>
        `;
        quantity_scanned_before = Number(temp_arr[1]);
        handle_selected_row = event.target.parentNode.parentNode;
        $('#div_modal_body').children().remove();
        $('#div_modal_body').append(modal_body_detail);
        $('#quantity_modal').modal();

    });
    $('#btn_quantity_save').click(function () {
        if (Number($('#input_quantity_scanned').val()) < 0) {
            Swal.fire("Scanned quantity cannot less than zero!");
            document.getElementById("audio_wrong").play();
            $('#input_quantity_scanned').val(quantity_scanned_before);

            var curTime = new Date();
            var LogData = { logdata: `Input quantity error => Scanned quantity cannot less than zero! ::: ${curTime}` };
            $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                console.log("save log result: ", result);
            });
            return;
        }
        if (Number($('#input_quantity_scanned').val()) > Number($('#input_quantity_scanned').attr('max'))) {
            Swal.fire("Scanned quantity cannot larger than ordered quantity!");
            document.getElementById("audio_wrong").play();
            $('#input_quantity_scanned').val(quantity_scanned_before);

            var curTime = new Date();
            var LogData = { logdata: `Input quantity error => Scanned quantity cannot larger than ordered quantity! ::: ${curTime}` };
            $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                console.log("save log result: ", result);
            });
            return;
        }

        let temp_arr = handle_selected_row.cells[4].innerHTML.split('/');
        handle_selected_row.cells[4].innerHTML = temp_arr[0] + '/' + $('#input_quantity_scanned').val();
        if (Number($('#input_quantity_scanned').val()) == 0)
            handle_selected_row.style.backgroundColor = '';
        else if (Number($('#input_quantity_scanned').val()) == Number($('#input_quantity_scanned').attr('max')))
            handle_selected_row.style.backgroundColor = 'green';
        else
            handle_selected_row.style.backgroundColor = 'lightskyblue';
        $('#quantity_modal').modal('hide');

        document.getElementById("audio_right").play();

        var curTime = new Date();
        var LogData = { logdata: `Success => Scan item successed by edit dialog - SKU: ${handle_selected_row.cells[1].innerHTML} UPC: ${handle_selected_row.cells[2].innerHTML} ::: ${curTime}` };
        $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
            console.log("save log result: ", result);
        });

        if (check_scan_item_completed()) {
            document.getElementById("audio_complete").play();
            initialize_for_new_order();
        }

    });
    $('#btn_reset').click(function () {
        if ($('#input_scan').attr('placeholder') == "Scan item") {
            reset_items();
            $('#input_scan').val('');
        }
        $('#input_scan').focus();
    });

});

function show_order_data(order_id) {
    let filterText = ['#', 'SKU', 'UPC', 'Name', 'Qty'];
    let tableData = document.getElementById("div_table");
    // get_Info_of_orderID_from_bigcommerce(order_id,function(res){   // Get information of order ID from bigcommerce using API
    //     let con_div = document.getElementById("div_con"); 
    //     let currentDiv = document.getElementById("div_table"); 
    //     let newDiv = document.createElement("div");
    //     newDiv.id="div_Order_ID";
    //     newDiv.innerHTML = "Order ID: " + order_id;
    //     // newDiv.innerHTML += "<br>Created at: " + res['date_created'] + "<br>Modified at: " + res['date_modified'];
    //     newDiv.className = "font-weight-bold mt-3";
    //     con_div.insertBefore(newDiv, currentDiv);
    // }); 
    get_data_from_bigcommerce(order_id, function (res) {   // Get data from Bigcommerce using API by order id
        $('.loader').hide();

        let con_div = document.getElementById("div_con");
        let newDiv = document.createElement("div");
        newDiv.id = "div_Order_ID";
        newDiv.innerHTML = "Order ID: " + order_id;
        newDiv.className = "font-weight-bold mt-3";
        con_div.insertBefore(newDiv, tableData);

        data = res;
        //console.log("return data: ", data);

        //set header of table
        let table = `
        <table class="table table-striped mt-3" id = "myTable">
            <thead class="thead-dark" style="position: sticky; top: 0 ;z-index:10">
                <tr>
                <th class="header" scope="col">${filterText[0]}</th>
                <th class="header" scope="col">${filterText[1]}</th>
                <th class="header" scope="col">${filterText[2]}</th>
                <th class="header" scope="col">${filterText[3]}</th>
                <th class="header" scope="col" style="text-align:center">${filterText[4]}</th>
                <th class="header" scope="col"></th>
                </tr>
            </thead>
        <tbody>
        `;
        //create//append rows
        for (i = 0; i < data.length; i++) {
            table = table +
                `<tr>
                <td style="width: 2%">${i + 1}</td>
                <td style="width: 19%">${data[i][0]}</td>
                <td style="width: 19%">${data[i][1]}</td>
                <td style="width: 50%">${data[i][2]}</td>
                <td style="width: 5%">${data[i][3]}</td>
                <td style="width: 5%"><i class="fa fa-edit" style="font-size:24px;color:#0099ff;z-index:1"></i></td>
            </tr>`
        }
        //close off table
        table = table +
            `</tbody>
        </table>`
            ;

        tableData.innerHTML = table;

        $('#btn_scan').text("Scan item");
        $('#input_scan').val("");
        $('#input_scan').attr('placeholder', 'Scan item');
        $('#scan_order_img').attr('src', 'assets/image/status_checked.png');
        $('#scan_item_img').attr('src', 'assets/image/status_checking.png');
    });

}

function get_data_from_bigcommerce(order_id, callback)        //get data from bigcommerce using API by order_id
{
    var rtn_data = [];
    console.log("order_id: ", order_id);
    var settings = {
        "url": "http://ordercheckerpro.com/sardar/index.php?orderId=" + order_id,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    };

    $.ajax(settings).done(function (response) {
        console.log(response);
        response = JSON.parse(response)
        data = JSON.parse(response.data);
        if (response.status && data[0].id) {
            response = data;
            for (i = 0; i < response.length; i++) {
                let temp = [response[i]['sku'], response[i]['upc'], response[i]['name'], response[i]['quantity'] + '/0'];
                rtn_data.push(temp);
            }
            if (typeof callback == "function") {
                document.getElementById("audio_right").play();

                var curTime = new Date();
                var LogData = { logdata: `Loading completed => Loading items for Order ID: ${order_id} completed. ::: ${curTime}` };
                $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                    console.log("save log result: ", result);
                });
                callback(rtn_data);
            }
        }
        else {
            document.getElementById("audio_wrong").play();
            Swal.fire("Can not get data from Bigcommerce!", "Check your network connection or<br> input correct order ID!");
            $('#input_scan').val('');

            var curTime = new Date();
            var LogData = { logdata: `Loading Failed => Loading items for Order ID: ${order_id} failed. ::: ${curTime}` };
            $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                console.log("save log result: ", result);
            });
        }

    }).fail(function (xhr, status, error) {
        document.getElementById("audio_wrong").play();
        Swal.fire("Can not get data from Bigcommerce!", "Check your network connection or<br> input correct order ID!");
        $('#input_scan').val('');

        var curTime = new Date();
        var LogData = { logdata: `Loading Failed => Loading items for Order ID: ${order_id} failed. ::: ${curTime}` };
        $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
            console.log("save log result: ", result);
        });
    });
}

function show_item_data(find_item) {
    // let obj = data.find(item => item[0] === find_item)
    // console.log("find result: ", obj);
    Search_item(find_item);
    if (check_scan_item_completed()) {
        document.getElementById("audio_complete").play();
        initialize_for_new_order();
    }
    $('#input_scan').val("");
}
function initialize_for_new_order() {
    let temp_arr = $('#div_Order_ID').text().split(':');
    Swal.fire('', "Scan of order ID:" + temp_arr[1] + " has been completed.").then((value) => {
        $('#btn_scan').text("Scan order");
        $('#input_scan').val("");
        $('#input_scan').attr('placeholder', 'Scan order');
        $('#scan_order_img').attr('src', 'assets/image/status_checking.png');
        $('#scan_item_img').attr('src', 'assets/image/status_blank.png');
        $('#div_Order_ID').remove();
        $('#div_table').children().remove();
        flag_initialized = true;
        $('#input_scan').focus();

        var curTime = new Date();
        var LogData = { logdata: `Scan item completed => Scan of order ID:${temp_arr[1]} has been completed. ::: ${curTime}` };
        $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
            console.log("save log result: ", result);
        });

    });
}
function Search_item(searchValue) {
    var searchTable = document.getElementById('myTable');
    var searchColCount; //Column Counetr
    var flag_found_item = false;
    //Loop through table rows
    for (var rowIndex = 0; rowIndex < searchTable.rows.length; rowIndex++) {
        var rowData = '';
        //Get column count from header row
        if (rowIndex == 0) {
            searchColCount = searchTable.rows.item(rowIndex).cells.length;
            continue; //do not execute further code for header row.
        }
        //Process data rows. (rowIndex >= 1)
        for (var colIndex = 0; colIndex < searchColCount; colIndex++) {
            if (searchTable.rows.item(rowIndex).cells.item(colIndex).textContent.toLowerCase() == searchValue.toLowerCase()) {
                flag_found_item = true;
                let temp_arr = searchTable.rows[rowIndex].cells[4].innerHTML.split('/');
                if (Number(temp_arr[1]) < Number(temp_arr[0])) {
                    temp_arr[1] = (Number(temp_arr[1]) + 1).toString();
                    if (Number(temp_arr[1]) == Number(temp_arr[0])) {
                        searchTable.rows.item(rowIndex).style.backgroundColor = 'green';
                    }
                    else {
                        searchTable.rows.item(rowIndex).style.backgroundColor = 'lightskyblue';
                    }
                    document.getElementById("audio_right").play();

                    var curTime = new Date();
                    var LogData = { logdata: `Success => Scan item successed - ${searchValue} ::: ${curTime}` };
                    $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                        console.log("save log result: ", result);
                    });

                } else {
                    document.getElementById("audio_wrong").play();
                    Swal.fire(searchValue + " is completed already!");

                    var curTime = new Date();
                    var LogData = { logdata: `Too many => ${searchValue} is completed already ::: ${curTime}` };
                    $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
                        console.log("save log result: ", result);
                    });

                }
                searchTable.rows[rowIndex].cells[4].innerHTML = temp_arr[0] + '/' + temp_arr[1];
                break;
            }
            //rowData += searchTable.rows.item(rowIndex).cells.item(colIndex).textContent;
        }
        //////////////////////////////////////////////////////////////////////////////////////////
        // //If search term is not found in row data
        // //then hide the row, else show
        // if (rowData.indexOf(searchValue) == -1)
        //     searchTable.rows.item(rowIndex).style.display = 'none';
        // else
        //     searchTable.rows.item(rowIndex).style.display = 'table-row';
        //////////////////////////////////////////////////////////////////////////////////////////

        ///////////// Change background color when table contains search value ///////////////////
        // if (rowData.indexOf(searchValue) != -1){
        //     let temp_arr = searchTable.rows[rowIndex].cells[4].innerHTML.split('/');
        //     if(Number(temp_arr[1]) < Number(temp_arr[0])){
        //        temp_arr[1] =  (Number(temp_arr[1]) + 1).toString();
        //        if(Number(temp_arr[1]) == Number(temp_arr[0])){
        //         searchTable.rows.item(rowIndex).style.backgroundColor = 'green';
        //        }
        //        else{
        //         searchTable.rows.item(rowIndex).style.backgroundColor = 'lightskyblue';
        //        }
        //     }
        //     searchTable.rows[rowIndex].cells[4].innerHTML = temp_arr[0] + '/' + temp_arr[1];
        // }
        /////////////////////////////////////////////////////////////////////////////////////////
    }
    if (!flag_found_item) {
        document.getElementById("audio_wrong").play();
        Swal.fire("Can not find item - " + searchValue);

        var curTime = new Date();
        var LogData = { logdata: `No match => Can not find item - ${searchValue} ::: ${curTime}` };
        $.post(`${window.location.href}SaveToLog`, LogData, function (result) {
            console.log("save log result: ", result);
        });

    }

}

function check_scan_item_completed() {
    var searchTable = document.getElementById('myTable');
    var scanned_item_count = 0;
    //Loop through table rows
    for (var rowIndex = 0; rowIndex < searchTable.rows.length; rowIndex++) {
        //Get column count from header row
        if (rowIndex == 0) {
            continue; //do not execute further code for header row.
        }
        let temp_arr = searchTable.rows[rowIndex].cells[4].innerHTML.split('/');
        if (Number(temp_arr[1]) == Number(temp_arr[0])) {
            scanned_item_count++;
        }
    }
    if (scanned_item_count == (searchTable.rows.length - 1))
        return true;
    return false;
}

function reset_items() {
    var searchTable = document.getElementById('myTable');
    //Loop through table rows
    for (var rowIndex = 0; rowIndex < searchTable.rows.length; rowIndex++) {
        //Get column count from header row
        if (rowIndex == 0) {
            continue; //do not execute further code for header row.
        }
        let temp_arr = searchTable.rows[rowIndex].cells[4].innerHTML.split('/');
        searchTable.rows[rowIndex].cells[4].innerHTML = temp_arr[0] + '/0';
        searchTable.rows[rowIndex].style.backgroundColor = '';
    }
}


/* Centering the modal vertically */
function alignModal() {
    var modalDialog = $(this).find(".modal-dialog");
    modalDialog.css("margin-top", Math.max(0,
        ($(window).height() - modalDialog.height()) / 2));
}
$(".modal").on("shown.bs.modal", alignModal);

/* Resizing the modal according the screen size */
$(window).on("resize", function () {
    $(".modal:visible").each(alignModal);
}); 
