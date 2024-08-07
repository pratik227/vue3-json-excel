<template>
  <div :id="idName" @click="generate" :style="isDisabled?{
  'opacity': '0.5',
  'pointer-events': 'none'}:{}">
    <slot> Download {{ name }}</slot>
  </div>
</template>

<script>
import download from "downloadjs";
import {defineComponent, ref} from 'vue'
import * as XLSX from 'xlsx/xlsx.mjs';
import saveAs from 'file-saver';

export default defineComponent({
  props: {
    // If true, don't download but emit a Blob
    emitBlob: {
      type: Boolean,
      default: false,
    },
    debounce: {
      type: Number,
      default: 500,
    },
    // mime type [xls, csv]
    type: {
      type: String,
      default: "xls",
    },
    // Json to download
    data: {
      type: Array,
      required: false,
      default: null,
    },
    // fields inside the Json Object that you want to export
    // if no given, all the properties in the Json are exported
    fields: {
      type: Object,
      default: () => null,
    },
    // this prop is used to fix the problem with other components that use the
    // variable fields, like vee-validate. exportFields works exactly like fields
    exportFields: {
      type: Object,
      default: () => null,
    },
    // Use as fallback when the row has no field values
    defaultValue: {
      type: String,
      required: false,
      default: "",
    },
    // Title(s) for the data, could be a string or an array of strings (multiple titles)
    header: {
      default: null,
    },
    // Title(s) for single column data, must be an array (ex: ['titleCol0',,TitleCol2])
    perColumnsHeaders: {
      default: null,
    },
    // Footer(s) for the data, could be a string or an array of strings (multiple footers)
    footer: {
      default: null,
    },
    // filename to export
    name: {
      type: String,
      default: "data.xls",
    },
    fetch: {
      type: Function,
    },
    meta: {
      type: Array,
      default: () => [],
    },
    worksheet: {
      type: String,
      default: "Sheet1",
    },
    //event before generate was called
    beforeGenerate: {
      type: Function,
    },
    //event before download pops up
    beforeFinish: {
      type: Function,
    },
    // Determine if CSV Data should be escaped
    escapeCsv: {
      type: Boolean,
      default: true,
    },
    rtl: {
      type: Boolean,
      default: false,
    },
    // long number stringify
    stringifyLongNum: {
      type: Boolean,
      default: false,
    },
    formats: {
      type: Object,
      default: () => ({}),
    },
    widths: {
      type: Object,
      default: () => ({}),
    },
  },
  setup() {
    return {
      isDisabled: ref(false)
    }
  },
  computed: {
    // unique identifier
    idName() {
      var now = new Date().getTime();
      return "export_" + now;
    },

    downloadFields() {
      if (this.fields) return this.fields;

      if (this.exportFields) return this.exportFields;
    },
  },
  methods: {
    async generate() {

      if (this.isDisabled) {
        return; // return early if button is disabled
      }
      this.isDisabled = true
      const debounce = this.$props.debounce
      let timeoutId = null;

      return new Promise((resolve, reject) => {
        const executeGenerate = async () => {
          if (typeof this.beforeGenerate === "function") {
            await this.beforeGenerate();
          }
          let data = this.data;
          if (typeof this.fetch === "function" || !data) data = await this.fetch();

          if (!data || !data.length) {
            if (typeof this.beforeFinish === "function") await this.beforeFinish();
            return;
          }

          let json = await this.getProcessedJson(data, this.downloadFields);
          if (this.type === "html") {
            // this is mainly for testing
            return this.export(
              this.jsonToXLS(json),
              this.name.replace(".xls", ".html"),
              "text/html"
            );
          } else if (this.type === "csv") {
            return this.export(
              this.jsonToCSV(json),
              this.name.replace(".xls", ".csv"),
              "application/csv"
            );
          } else if (this.type === "xlsx") {
            const xlsxBuffer = this.jsonToXLSX(json, this.worksheet);
            return this.generateXLSX(xlsxBuffer, this.name);
          }
          return this.export(
            this.jsonToXLS(json),
            this.name,
            "application/vnd.ms-excel"
          );
        };

        const debouncedGenerate = () => {
          let self = this;
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            executeGenerate().then(resolve).catch(reject);
            self.isDisabled = false
          }, debounce);
        };

        debouncedGenerate();
      });
    },
    /*
		Use downloadjs to generate the download link
		*/
    export: async function (data, filename, mime) {
      let blob = this.base64ToBlob(data, mime);
      if (typeof this.beforeFinish === "function") await this.beforeFinish();
      if (this.emitBlob) this.$emit("blob", blob);
      else download(blob, filename, mime);
    },
    generateXLSX(xlsxBuffer, fileName) {
      function s2ab(s) {
        let buf = new ArrayBuffer(s.length);
        let view = new Uint8Array(buf);
        for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
        return buf;
      }

      if (typeof xlsxBuffer === 'string') {
        xlsxBuffer = s2ab(xlsxBuffer);
      }
      saveAs(new Blob([xlsxBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), fileName);
    },

    /*
		jsonToXLS
		---------------
		Transform json data into an xml document with MS Excel format, sadly
		it shows a prompt when it opens, that is a default behavior for
		Microsoft office and cannot be avoided. It's recommended to use CSV format instead.
		*/
    jsonToXLS(data) {
      let xlsTemp =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta name=ProgId content=Excel.Sheet> <meta name=Generator content="Microsoft Excel 11"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>br {mso-data-placement: same-cell;}</style></head><body><table>${table}</table></body></html>';
      let xlsData = "<thead>";
      const colspan = Object.keys(data[0]).length;
      let _self = this;

      //Header
      const header = this.header || this.$attrs.title;
      if (header) {
        xlsData += this.parseExtraData(
          header,
          '<tr><th colspan="' + colspan + '">${data}</th></tr>'
        );
      }
      // perColumnsHeaders
      const perColumnsHeaders = this.perColumnsHeaders;
      if (Array.isArray(perColumnsHeaders)) {
        xlsData += "<tr>";
        for (let pchKey in perColumnsHeaders) {
          xlsData += "<th>" + perColumnsHeaders[pchKey] + "</th>";
        }
        xlsData += "</tr>";
      }

      //Fields
      xlsData += "<tr>";
      for (let key in data[0]) {
        xlsData += "<th>" + key + "</th>";
      }
      xlsData += "</tr>";
      xlsData += "</thead>";

      //Data
      xlsData += "<tbody>";
      data.map(function (item, index) {
        xlsData += "<tr>";
        for (let key in item) {
          xlsData +=
            "<td>" +
            _self.preprocessLongNum(
              _self.valueReformattedForMultilines(item[key])
            ) +
            "</td>";
        }
        xlsData += "</tr>";
      });
      xlsData += "</tbody>";

      //Footer
      if (this.footer != null) {
        xlsData += "<tfoot>";
        xlsData += this.parseExtraData(
          this.footer,
          '<tr><td colspan="' + colspan + '">${data}</td></tr>'
        );
        xlsData += "</tfoot>";
      }

      return xlsTemp
        .replace("${table}", xlsData)
        .replace("${worksheet}", this.worksheet);
    },
    /*
    jsonToXLS
     */
    // jsonToXLSX(data, worksheet) {
    //   const ws = XLSX.utils.json_to_sheet(data);
    //   const wb = XLSX.utils.book_new();
    //   XLSX.utils.book_append_sheet(wb, ws, worksheet || 'Sheet1');
    //   const buf = XLSX.write(wb, {
    //     type: 'buffer',
    //     mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    //   });
    //   return buf;
    // },
    jsonToXLSX(data, worksheet) {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, worksheet || 'Sheet1');

      if (this.rtl) {
        wb.Workbook = {
          Views: [
            {RTL: true}
          ]
        };
      }

      const formats = this.formats;
      const range = XLSX.utils.decode_range(ws['!ref']);

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const col = XLSX.utils.encode_col(C);
        if (formats[col]) {
          for (let R = range.s.r + 1; R <= range.e.r; ++R) { // +1 to skip the header row
            const cell = ws[`${col}${R + 1}`];
            if (cell) {
              cell.z = formats[col];
            }
          }
        }
      }

      const widths = this.widths;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const col = XLSX.utils.encode_col(C);
        if (widths[col]) {
          ws[`!cols`] = ws[`!cols`] || [];
          ws[`!cols`][C] = {wch: widths[col]};
        }
      }

      const buf = XLSX.write(wb, {
        type: 'buffer',
        bookType: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      return buf;
    },
    /*
		jsonToCSV
		---------------
		Transform json data into an CSV file.
		*/
    jsonToCSV(data) {
      let _self = this;
      var csvData = [];

      //Header
      const header = this.header || this.$attrs.title;
      if (header) {
        csvData.push(this.parseExtraData(header, "${data}\r\n"));
      }

      // perColumnsHeaders
      const perColumnsHeaders = this.perColumnsHeaders;
      if (Array.isArray(perColumnsHeaders)) {
        for (let pchKey in perColumnsHeaders) {
          csvData.push(perColumnsHeaders[pchKey]);
          csvData.push(",");
        }
        csvData.pop();
        csvData.push("\r\n");
      }

      //Fields
      for (let key in data[0]) {
        csvData.push(key);
        csvData.push(",");
      }
      csvData.pop();
      csvData.push("\r\n");
      //Data
      data.map(function (item) {
        for (let key in item) {
          let escapedCSV = item[key] + "";
          // Escaped CSV data to string to avoid problems with numbers or other types of values
          // this is controlled by the prop escapeCsv
          if (_self.escapeCsv) {
            escapedCSV = '="' + escapedCSV + '"'; // cast Numbers to string
            if (escapedCSV.match(/[,"\n]/)) {
              escapedCSV = '"' + escapedCSV.replace(/\"/g, '""') + '"';
            }
          }
          csvData.push(escapedCSV);
          csvData.push(",");
        }
        csvData.pop();
        csvData.push("\r\n");
      });
      //Footer
      if (this.footer != null) {
        csvData.push(this.parseExtraData(this.footer, "${data}\r\n"));
      }
      return csvData.join("");
    },
    /*
		getProcessedJson
		---------------
		Get only the data to export, if no fields are set return all the data
		*/
    async getProcessedJson(data, header) {
      let keys = this.getKeys(data, header);
      let newData = [];
      let _self = this;
      await data.reduce(async function (prev, current) {
        await prev;
        let newItem = {};
        for (let label in keys) {
          let property = keys[label];
          newItem[label] = await _self.getValue(property, current);
        }
        newData.push(newItem);
        return true;
      }, []);

      return newData;
    },
    getKeys(data, header) {
      if (header) {
        return header;
      }

      let keys = {};
      for (let key in data[0]) {
        keys[key] = key;
      }
      return keys;
    },
    /*
		parseExtraData
		---------------
		Parse title and footer attribute to the csv format
		*/
    parseExtraData(extraData, format) {
      let parseData = "";
      if (Array.isArray(extraData)) {
        for (var i = 0; i < extraData.length; i++) {
          if (extraData[i])
            parseData += format.replace("${data}", extraData[i]);
        }
      } else {
        parseData += format.replace("${data}", extraData);
      }
      return parseData;
    },

    async getValue(key, item) {
      const field = typeof key !== "object" ? key : key.field;
      let indexes = typeof field !== "string" ? [] : field.split(".");
      let value = this.defaultValue;

      if (!field) value = item;
      else if (indexes.length > 1)
        value = await this.getValueFromNestedItem(item, indexes);
      else value = this.parseValue(item[field]);

      if (key.hasOwnProperty("callback"))
        value = await this.getValueFromCallback(value, key.callback);

      return value;
    },

    /*
    convert values with newline \n characters into <br/>
    */
    valueReformattedForMultilines(value) {
      if (typeof value == "string") return value.replace(/\n/gi, "<br/>");
      else return value;
    },
    preprocessLongNum(value) {
      if (this.stringifyLongNum) {
        if (String(value).startsWith("0x")) {
          return value;
        }
        if (!isNaN(value) && value != "") {
          if (value > 99999999999 || value < 0.0000000000001) {
            return '="' + value + '"';
          }
        }
      }
      return value;
    },
    getValueFromNestedItem(item, indexes) {
      let nestedItem = item;
      for (let index of indexes) {
        if (nestedItem) nestedItem = nestedItem[index];
      }
      return this.parseValue(nestedItem);
    },

    async getValueFromCallback(item, callback) {
      if (typeof callback !== "function") return this.defaultValue;
      const value = await callback(item);
      return this.parseValue(value);
    },
    parseValue(value) {
      return value || value === 0 || typeof value === "boolean"
        ? value
        : this.defaultValue;
    },
    base64ToBlob(data, mime) {
      let base64 = window.btoa(window.unescape(encodeURIComponent(data)));
      let bstr = atob(base64);
      let n = bstr.length;
      let u8arr = new Uint8ClampedArray(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type: mime});
    },
  }, // end methods
});
</script>
