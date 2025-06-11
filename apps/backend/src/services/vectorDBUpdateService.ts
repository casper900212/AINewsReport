import { vectorDBUpdateRepository } from '../repository/vectorDBUpdateRepository'

export const logVectorDBUpdate = async () => {
  return await vectorDBUpdateRepository.logUpdate()
}

export const getLatestVectorDBUpdate = async () => {
  return await vectorDBUpdateRepository.getLatestUpdate()
}
