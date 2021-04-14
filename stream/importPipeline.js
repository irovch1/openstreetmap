var categoryDefaults = require('../config/category_map');

var streams = {};

streams.config = {
  categoryDefaults: categoryDefaults
};

streams.pbfParser = require('./multiple_pbfs').create;
streams.docConstructor = require('./document_constructor');
streams.blacklistStream = require('pelias-blacklist-stream');
streams.tagMapper = require('./tag_mapper');
streams.adminLookup = require('pelias-wof-admin-lookup').create;
streams.addressExtractor = require('./address_extractor');
streams.categoryMapper = require('./category_mapper');
streams.addendumMapper = require('./addendum_mapper');
streams.popularityMapper = require('./popularity_mapper');
streams.dbMapper = require('pelias-model').createDocumentMapperStream;
streams.elasticsearch = require('pelias-dbclient');

const through = require('through2');
const DUMP_TO = process.env.DUMP_TO;

function createDocumentMapperStream() {
  if(DUMP_TO) {
    return through.obj( function( model, enc, next ){
      next(null, model.callPostProcessingScripts());
    });
  }

  return streams.dbMapper();
}

// default import pipeline
streams.import = function(){
  streams.pbfParser()
    .pipe( streams.docConstructor() )
    .pipe( streams.tagMapper() )
    .pipe( streams.addressExtractor() )
    .pipe( streams.blacklistStream() )
    .pipe( streams.categoryMapper( categoryDefaults ) )
    .pipe( streams.addendumMapper() )
    .pipe( streams.popularityMapper() )
    .pipe( streams.adminLookup() )
    .pipe( createDocumentMapperStream() )
    .pipe( streams.elasticsearch({name: 'openstreetmap'}) );
};

module.exports = streams;
