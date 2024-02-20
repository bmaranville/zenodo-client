import * as Vue from 'vue';
var exports = {};

const template = `
<div>
  <h3>User: {{ email }} logged in ({{ user_id }})</h3>
  <button @click="add_search_term">Add search term</button>
  <button @click="search">Search</button>
  <div v-for="search_term in search_terms" :key="search_term.field_name">
    <select v-model="search_term.field_name">
      <option v-for="(field, field_name) of fields" :value="field_name" :key="field_name">{{ field_name }}</option>
    </select>
    <input type="text" v-model="search_term.value" @keydown.enter="search"></input>
  </div>
  <pre class="results">{{ results }}</pre>
</div>
`

const App = {
  setup() {
    const fields = Vue.ref(simple_fields);
    const search_terms = Vue.ref([]);
    const results = Vue.ref("");
    const email = Vue.ref("");
    const user_id = Vue.ref("");
    return { fields, search_terms, results }
  },
  methods: {
    add_search_term() {
      this.search_terms.push({field_name: null, value: null});
    },
    async search() {
      const search_string = this.search_terms.map(({field_name, value}) => `${field_name}:(${value})`).join(" ");
      const params = new URLSearchParams({q: search_string});
      // this.search_terms.forEach(({field_name, value}) => {
      //   params.set(field_name, value);
      // })
      console.log(params.toString());
      const r = await fetch(`${api_url}/records?${params}`);
      const result = await r.json();
      console.log(result);
      this.results = JSON.stringify(result.hits?.hits?.[0], null, 2);

    }
  },
  async mounted() {
    const me = await (await fetch(`${api_url}/me`)).json();
    this.email = me?.email ?? '';
    this.user_id = me?.id ?? '';
  },
  template
}

const api_url = "https://zenodo.org/api"

// const zenodo_tag = "deploy-qa-2023-08-01-1247";
const zenodo_tag = "master";

const records_schema = await (await fetch(`https://cdn.jsdelivr.net/gh/zenodo/zenodo@${zenodo_tag}/zenodo/modules/records/jsonschemas/records/record-v1.0.0.json`)).json();
const search_fields = Object.fromEntries(Object.entries(records_schema.properties).filter((name, value) => (!(/^[$_]/.test(name)))));
const simple_fields = Object.fromEntries(Object.entries(search_fields).filter(([name, value]) => value.type === 'string' || (value.type === 'array' && value?.items?.type === 'string')));
const object_fields_entries = Object.entries(search_fields).filter(([name, value]) => value?.items?.type === 'object' || value.type === 'object');
object_fields_entries.forEach(([name, value]) => {
  console.log(name, value);
  const properties = value?.items?.properties ?? value?.properties;
  if (properties) {
    Object.entries(properties).forEach(([subname, subvalue]) => simple_fields[`${name}.${subname}`] = subvalue);
  }
})

console.log(search_fields);
globalThis.records_schema = records_schema;
globalThis.search_fields = search_fields;

const resource_types = [
  "publication",
  "poster",
  "presentation",
  "dataset",
  "image",
  "video",
  "software",
  "lesson",
  "other",
]

const app = Vue.createApp(App);
console.log(Vue);
app.mount('#app');
