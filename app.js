const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializerDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializerDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API 1 //

app.get("/states/", async (request, response) => {
  const getStateQuery = `
      SELECT
        *
      FROM
        state;`;
  const stateArray = await database.all(getStateQuery);
  response.send(
    stateArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

//API 2 //

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
        SELECT
            *
        FROM
            state
        WHERE
            state_id = ${stateId};`;
  const stateArray = await database.get(getStatesQuery);
  response.send(convertStateDbObjectToResponseObject(stateArray));
});

//API 3//
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictsQuery = `
        INSERT INTO
            district (district_name , state_id, cases, cured, active, deaths)
        VALUES
            ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const district = await database.run(postDistrictsQuery);
  response.send("District Successfully Added");
});

//API 4//

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
        SELECT
            *
        FROM
            district
        WHERE
            district_id = ${districtId};`;
  const districtArray = await database.get(getDistrictsQuery);
  response.send(convertDistrictDbObjectToResponseObject(districtArray));
});

// API 5//
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM
            district
        WHERE
            district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6 //
app.put(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetails = `
        UPDATE
            district
        SET
            district_name = '${districtName}',
            state_id       = ${stateId},
            cases          = ${cases},
            cured     =${cured},
            active    = '${active}',
            deaths    =  ${deaths}
        WHERE
            district_id = ${districtId};`;
  await database.run(updateDistrictDetails);
  response.send("District Details Updated");
});

// API 7 //

app.get(`/states/:stateId/stats/`, async (request, response) => {
  const { stateId } = request.params;
  const getStatesStats = `
        SELECT
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM
            district
        WHERE
            state_id = ${stateId};`;
  const stats = await database.get(getStatesStats);
  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// API 8 //

app.get(`/districts/:districtId/details/`, async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
        SELECT
            state_id
        FROM
            district
        WHERE
            district_id = ${districtId};`;
  const getDistrictQueryResponse = await database.get(getDistrictIdQuery);

  const getStateNameQuery = `
        SELECT
            state_name AS stateName
        FROM
            state
        WHERE
            state_id = ${getDistrictQueryResponse.state_id};`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
