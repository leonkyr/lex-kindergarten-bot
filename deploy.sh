#!/bin/bash

if [ -z ${AWS_ACCOUNT_ID+x} ]; then
    echo "variable AWS_ACCOUNT_ID is not set"
    exit 1
fi

INIT=$1
if [[ "$INIT" ]]
then
    echo 'Initializing ...';
else
    echo 'Updating ...';
fi

SOURCE_ZIP="bots.zip"
S3_BUCKET_NAME="source.distributedleo.com"
S3_CODE="S3Bucket=$S3_BUCKET_NAME,S3Key=$SOURCE_ZIP"
PWD=`pwd`

echo '----------------- Zipping this folder ----------------- '
zip -r $SOURCE_ZIP * -x "*/tests*" -x "README.md" 1>/dev/null

echo '----------------- Uploading addons.zip to s3 bucket source.distributedleo.com ----------------- '
aws s3 cp ./$SOURCE_ZIP s3://$S3_BUCKET_NAME/

S3_RESOURSE_BUCKET_NAME="resources.distributedleo.com"

echo '----------------- Updating lambdas ----------------- '

create_initial_aliases() {
	FUNCTION_NAME="$1"
    aws lambda create-alias \
		--function-name $FUNCTION_NAME \
		--description "DEV $FUNCTION_NAME" \
		--function-version "\$LATEST" \
		--name dev

	VERSION=$(aws lambda publish-version --function-name $FUNCTION_NAME | jq -r '.Version')

	aws lambda create-alias \
		--function-name $FUNCTION_NAME \
		--description "PROD $FUNCTION_NAME" \
		--function-version "$VERSION" \
		--name prod
}

FUNCTION='lex-kindergarten-hi'
echo "----------------- $FUNCTION -----------------"
if [[ "$INIT" ]]
then
    aws lambda create-function \
		--function-name $FUNCTION \
		--runtime 'nodejs4.3' \
    	--role "arn:aws:iam::$AWS_ACCOUNT_ID:role/lambda-exec-role-fox-lex-get-started" \
		--handler 'lifecycle/installed.handler' \
		--code $S3_CODE \
		--description 'Kindergarten bot' \
        --memory 128 \
        --timeout 10

	create_initial_aliases "$FUNCTION"
else
    aws lambda update-function-code \
    	--function-name $FUNCTION   \
    	--s3-bucket $S3_BUCKET_NAME \
    	--s3-key $SOURCE_ZIP
fi
