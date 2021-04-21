const wikis = ["fr", "it", "ar"];

wikis.forEach(wiki => {
  publish("pageviews_" + wiki + "_2021")
    .type("incremental")
    .dependencies(["pageviews_2021"])
    .bigquery({
      "partitionBy": "DATE(datehour)",
      "clusterBy": ["wiki", "title"]
    })
    .preOps(
      ctx => `
      DECLARE max_datehour TIMESTAMP DEFAULT "2021-01-01";
      ${ctx.when(ctx.incremental(),
          `SET max_datehour = (
              SELECT max_datehour 
              FROM ${ctx.ref("max_times")} 
              WHERE table = "${"pageviews_" + wiki + "_2021"}"
          );`
      ,)}
    `)
    .query(
      ctx => `
      SELECT datehour, wiki, title, views
      FROM ${ctx.ref("pageviews_2021")}
      WHERE wiki LIKE "${wiki}%"
      ${ctx.when(ctx.incremental(), 
              //If in incremental mode, look for the newest records
              `AND datehour >= "2021-01-01" AND datehour > max_datehour`, 
              // Else condition. We need this to satisfy mandatory filter by partition
              `AND datehour >= "2021-01-01"`
            )}
      `
    );
});