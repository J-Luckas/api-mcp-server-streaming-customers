import { getCustomersData } from "./customers.js";
import { getMoviesData } from "./movies.js";

async function main() {
  const all = await getCustomersData({
    customerIdList: [1]
  }, ['id', 'name', 'lastLogin']);
  console.log("Todos:", all.length, "registros\n", all.slice(0, 3));

  // const all = await getMoviesData({
  //   name: 's'
  // }, ['id', 'name', 'categoryName']);

  // const one = await getCustomersData([1,2,3]);
  // console.log("\nClientes id=1,2,3:\n", one);

  // const byDate = await getCustomersData(
  //   undefined,
  //   new Date("2025-01-01"),
  //   new Date()
  // );
  // console.log("\nCom lastLogin em 2025:\n", byDate.length, "registros");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
